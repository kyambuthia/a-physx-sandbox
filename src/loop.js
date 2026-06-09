import { TIME_STEP } from './config.js'
import { getRenderer, getScene, getCamera, getControls } from './scene.js'
import { updateSpawning, stepPhysics, syncBodies, runPostStep } from './systems.js'

export function startLoop() {
  function animate() {
    requestAnimationFrame(animate)

    updateSpawning(TIME_STEP)
    stepPhysics(TIME_STEP)
    syncBodies()
    runPostStep(TIME_STEP)

    getControls().update()
    getRenderer().render(getScene(), getCamera())
  }

  animate()
}
