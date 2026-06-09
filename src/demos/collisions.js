import * as THREE from 'three'
import { createScene, addLighting, addFloor, onResize, getScene } from '../scene.js'
import { initPhysics, setupPhysics, createFloorBody, getJolt, getPhysicsSystem } from '../physics.js'
import { spawnBall, getBalls, getBallByBodyId } from '../entities.js'
import { addPostStepHook } from '../systems.js'
import { startLoop } from '../loop.js'

const FLASH_DURATION = 0.3
const MAX_MARKERS = 20
const MARKER_COOLDOWN_MS = 400

export default async function demoCollisions() {
  const jolt = await initPhysics()
  createScene()
  addLighting()
  addFloor()
  setupPhysics()
  createFloorBody()

  const contactMarkers = []
  const activeFlashes = []
  const pairCooldowns = new Map()

  const contactListener = new jolt.ContactListenerJS()
  contactListener.OnContactAdded = (body1Ptr, body2Ptr, manifoldPtr) => {
    const b1 = jolt.wrapPointer(body1Ptr, jolt.Body)
    const b2 = jolt.wrapPointer(body2Ptr, jolt.Body)
    const id1 = b1.GetID().GetIndexAndSequenceNumber()
    const id2 = b2.GetID().GetIndexAndSequenceNumber()

    const a = getBallByBodyId(id1)
    const b = getBallByBodyId(id2)
    if (!a || !b) return

    flashBall(a, activeFlashes)
    flashBall(b, activeFlashes)

    const pairKey = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`
    const now = performance.now()
    if (now - (pairCooldowns.get(pairKey) || 0) < MARKER_COOLDOWN_MS) return
    pairCooldowns.set(pairKey, now)

    const manifold = jolt.wrapPointer(manifoldPtr, jolt.ContactManifold)
    const cp = manifold.GetWorldSpaceContactPointOn1(0)

    while (contactMarkers.length >= MAX_MARKERS) {
      const old = contactMarkers.shift()
      getScene().remove(old.mesh)
      old.mesh.geometry.dispose()
      old.mesh.material.dispose()
    }

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })
    )
    marker.position.set(cp.GetX(), cp.GetY(), cp.GetZ())
    getScene().add(marker)
    contactMarkers.push({ mesh: marker, age: 0 })
  }
  contactListener.OnContactPersisted = () => {}
  contactListener.OnContactRemoved = () => {}

  getPhysicsSystem().SetContactListener(contactListener)

  for (let i = 0; i < 8; i++) spawnBall()

  addPostStepHook((delta) => {
    for (let i = contactMarkers.length - 1; i >= 0; i--) {
      const m = contactMarkers[i]
      m.age += delta
      const t = Math.max(0, 1 - m.age / 0.5)
      m.mesh.material.opacity = t
      m.mesh.scale.setScalar(0.5 + t * 0.5)
      if (m.age >= 0.5) {
        getScene().remove(m.mesh)
        m.mesh.geometry.dispose()
        m.mesh.material.dispose()
        contactMarkers.splice(i, 1)
      }
    }

    for (let i = activeFlashes.length - 1; i >= 0; i--) {
      const f = activeFlashes[i]
      f.timer -= delta
      if (f.timer <= 0) {
        f.entry.mesh.material.emissive.set(0x000000)
        activeFlashes.splice(i, 1)
      }
    }
  })

  onResize()
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', () => setTimeout(onResize, 150))
  startLoop()
}

function flashBall(entry, flasher) {
  entry.mesh.material.emissive.set(0xffffff)
  entry.mesh.material.emissiveIntensity = 0.6
  const existing = flasher.find(f => f.entry === entry)
  if (existing) {
    existing.timer = FLASH_DURATION
  } else {
    flasher.push({ entry, timer: FLASH_DURATION })
  }
}
