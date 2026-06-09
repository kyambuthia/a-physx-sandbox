import { SPAWN_INTERVAL, BALL_COUNT } from './config.js'
import { getJoltInterface } from './physics.js'
import { getBalls, getBallCount, spawnBall } from './entities.js'

let spawnTimer = 0

export function resetSpawnTimer() { spawnTimer = 0 }

export function updateSpawning(delta) {
  spawnTimer += delta
  if (spawnTimer >= SPAWN_INTERVAL && getBallCount() < BALL_COUNT) {
    spawnTimer = 0
    spawnBall()
  }
}

export function stepPhysics(delta) {
  getJoltInterface().Step(delta, 1)
}

export function syncBodies() {
  const balls = getBalls()
  for (let i = balls.length - 1; i >= 0; i--) {
    const { body, mesh } = balls[i]
    const pos = body.GetPosition()
    mesh.position.set(pos.GetX(), pos.GetY(), pos.GetZ())
    const rot = body.GetRotation()
    mesh.quaternion.set(rot.GetX(), rot.GetY(), rot.GetZ(), rot.GetW())
  }
}
