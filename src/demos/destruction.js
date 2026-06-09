import * as THREE from 'three'
import { createScene, addLighting, addFloor, onResize, getScene } from '../scene.js'
import { initPhysics, setupPhysics, createFloorBody, getJolt, getBodyInterface, getPhysicsSystem } from '../physics.js'
import { spawnBall, getBalls, getBallByBodyId, removeBall } from '../entities.js'
import { addPostStepHook } from '../systems.js'
import { startLoop } from '../loop.js'
import {
  LAYER_MOVING, SPHERE_SEGMENTS, BALL_COUNT,
  BALL_RADIUS_MIN, BALL_RADIUS_MAX,
  SPAWN_HEIGHT, SPAWN_RADIUS, COLORS,
} from '../config.js'

const DESTROY_VELOCITY = 8
const FRAGMENT_COUNT_MIN = 4
const FRAGMENT_COUNT_MAX = 8
const FRAGMENT_SPEED = 6

const pendingDestructions = []

export default async function demoDestruction() {
  const jolt = await initPhysics()
  createScene()
  addLighting()
  addFloor()
  setupPhysics()
  createFloorBody()

  const contactListener = new jolt.ContactListenerJS()
  contactListener.OnContactAdded = (body1Ptr, body2Ptr, manifoldPtr) => {
    const b1 = jolt.wrapPointer(body1Ptr, jolt.Body)
    const b2 = jolt.wrapPointer(body2Ptr, jolt.Body)
    const id1 = b1.GetID().GetIndexAndSequenceNumber()
    const id2 = b2.GetID().GetIndexAndSequenceNumber()

    const a = getBallByBodyId(id1)
    const b = getBallByBodyId(id2)
    if (!a || !b) return

    const velA = b1.GetLinearVelocity()
    const velB = b2.GetLinearVelocity()
    const relVel = Math.sqrt(
      (velA.GetX() - velB.GetX()) ** 2 +
      (velA.GetY() - velB.GetY()) ** 2 +
      (velA.GetZ() - velB.GetZ()) ** 2
    )

    if (relVel < DESTROY_VELOCITY) return

    const manifold = jolt.wrapPointer(manifoldPtr, jolt.ContactManifold)
    const cp = manifold.GetWorldSpaceContactPointOn1(0)
    const contactPoint = new THREE.Vector3(cp.GetX(), cp.GetY(), cp.GetZ())

    pendingDestructions.push({ a, b, contactPoint })
  }

  getPhysicsSystem().SetContactListener(contactListener)

  for (let i = 0; i < 8; i++) spawnBall()

  addPostStepHook((delta) => {
    const destroyed = new Set()

    for (const { a, b, contactPoint } of pendingDestructions) {
      if (destroyed.has(a) || destroyed.has(b)) continue
      destroyed.add(a)
      destroyed.add(b)
      spawnFragments(a, contactPoint)
      spawnFragments(b, contactPoint)
      removeBall(a)
      removeBall(b)
    }

    pendingDestructions.length = 0
  })

  onResize()
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', () => setTimeout(onResize, 150))
  startLoop()
}

function spawnFragments(source, contactPoint) {
  const jolt = getJolt()
  const bodyInterface = getBodyInterface()
  const scene = getScene()

  const count = FRAGMENT_COUNT_MIN + Math.floor(Math.random() * (FRAGMENT_COUNT_MAX - FRAGMENT_COUNT_MIN + 1))
  const fragRadius = source.radius * 0.35 + Math.random() * 0.1
  const sourcePos = source.mesh.position.clone()

  for (let i = 0; i < count; i++) {
    const shape = new jolt.SphereShape(fragRadius, null)
    const pos = new jolt.RVec3(sourcePos.x, sourcePos.y, sourcePos.z)
    const rot = jolt.Quat.prototype.sIdentity()
    const settings = new jolt.BodyCreationSettings(shape, pos, rot, jolt.EMotionType_Dynamic, LAYER_MOVING)
    settings.mRestitution = 0.3 + Math.random() * 0.3
    settings.mFriction = 0.4
    jolt.destroy(pos)
    jolt.destroy(rot)

    const body = bodyInterface.CreateBody(settings)
    bodyInterface.AddBody(body.GetID(), jolt.EActivation_Activate)
    jolt.destroy(settings)

    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 1.5,
      (Math.random() - 0.5) * 2
    ).normalize()

    const vel = new jolt.Vec3(
      dir.x * FRAGMENT_SPEED * (0.5 + Math.random()),
      dir.y * FRAGMENT_SPEED * (0.5 + Math.random()),
      dir.z * FRAGMENT_SPEED * (0.5 + Math.random())
    )
    body.SetLinearVelocity(vel)
    jolt.destroy(vel)

    const fragColor = new THREE.Color(source.color).offsetHSL(
      (Math.random() - 0.5) * 0.15, 0, (Math.random() - 0.5) * 0.3
    )

    const geometry = new THREE.SphereGeometry(fragRadius, SPHERE_SEGMENTS, SPHERE_SEGMENTS)
    const material = new THREE.MeshStandardMaterial({
      color: fragColor.getHex(),
      roughness: 0.4,
      metalness: 0.3,
      emissive: 0x331100,
      emissiveIntensity: 0.5,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(sourcePos)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)

    const entry = { body, mesh, radius: fragRadius, color: fragColor.getHex() }
    getBalls().push(entry)
  }
}
