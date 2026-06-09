import * as THREE from 'three'
import { getJolt, getBodyInterface, getPhysicsSystem } from './physics.js'
import { getScene } from './scene.js'
import {
  BALL_COUNT, BALL_RADIUS_MIN, BALL_RADIUS_MAX,
  SPAWN_HEIGHT, SPAWN_RADIUS, LAYER_MOVING,
  COLORS, SPHERE_SEGMENTS,
} from './config.js'

let balls = []
let ballCount = 0

export function getBalls() { return balls }
export function getBallCount() { return ballCount }

const bodyToBall = new Map()

export function getBallByBodyId(bodyId) {
  return bodyToBall.get(bodyId)
}

export function removeBall(entry) {
  const idx = balls.indexOf(entry)
  if (idx !== -1) {
    balls.splice(idx, 1)
    ballCount--
  }
  const id = entry.body.GetID().GetIndexAndSequenceNumber()
  bodyToBall.delete(id)
  getBodyInterface().DestroyBody(entry.body.GetID())
  getScene().remove(entry.mesh)
  entry.mesh.geometry.dispose()
  entry.mesh.material.dispose()
}

export function spawnBall() {
  if (ballCount >= BALL_COUNT) return null

  const jolt = getJolt()
  const bodyInterface = getBodyInterface()
  const scene = getScene()

  const radius = BALL_RADIUS_MIN + Math.random() * (BALL_RADIUS_MAX - BALL_RADIUS_MIN)
  const angle = Math.random() * Math.PI * 2
  const dist = Math.random() * SPAWN_RADIUS
  const x = Math.cos(angle) * dist
  const z = Math.sin(angle) * dist

  const color = COLORS[ballCount % COLORS.length]

  const shape = new jolt.SphereShape(radius, null)
  const pos = new jolt.RVec3(x, SPAWN_HEIGHT, z)
  const rot = jolt.Quat.prototype.sIdentity()
  const settings = new jolt.BodyCreationSettings(shape, pos, rot, jolt.EMotionType_Dynamic, LAYER_MOVING)
  settings.mRestitution = 0.5 + Math.random() * 0.3
  settings.mFriction = 0.3
  jolt.destroy(pos)
  jolt.destroy(rot)

  const body = bodyInterface.CreateBody(settings)
  bodyInterface.AddBody(body.GetID(), jolt.EActivation_Activate)
  jolt.destroy(settings)

  const geometry = new THREE.SphereGeometry(radius, SPHERE_SEGMENTS, SPHERE_SEGMENTS)
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.4 })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  scene.add(mesh)

  const entry = { body, mesh, radius, color }
  balls.push(entry)
  ballCount++
  bodyToBall.set(body.GetID().GetIndexAndSequenceNumber(), entry)
  return entry
}
