import { createScene, addLighting, addFloor, onResize } from './scene.js'
import { initPhysics, setupPhysics, createFloorBody } from './physics.js'
import { spawnBall } from './entities.js'
import { startLoop } from './loop.js'

async function init() {
  await initPhysics()
  createScene()
  addLighting()
  addFloor()
  setupPhysics()
  createFloorBody()

  for (let i = 0; i < 8; i++) {
    spawnBall()
  }

  onResize()
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', () => setTimeout(onResize, 150))

  startLoop()
}

init()
