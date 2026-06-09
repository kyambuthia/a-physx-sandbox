import { LAYER_NON_MOVING, LAYER_MOVING, NUM_OBJECT_LAYERS } from './config.js'

let jolt, bodyInterface, physicsSystem, joltInterface

export async function initPhysics() {
  jolt = await import('jolt-physics').then(m => m.default())
  return jolt
}

export function setupPhysics() {
  const joltSettings = new jolt.JoltSettings()
  joltSettings.mMaxWorkerThreads = 2
  setupCollisionFiltering(joltSettings)

  joltInterface = new jolt.JoltInterface(joltSettings)
  jolt.destroy(joltSettings)
  physicsSystem = joltInterface.GetPhysicsSystem()
  bodyInterface = physicsSystem.GetBodyInterface()
}

function setupCollisionFiltering(settings) {
  const objectFilter = new jolt.ObjectLayerPairFilterTable(NUM_OBJECT_LAYERS)
  objectFilter.EnableCollision(LAYER_NON_MOVING, LAYER_MOVING)
  objectFilter.EnableCollision(LAYER_MOVING, LAYER_MOVING)

  const BP_LAYER_NON_MOVING = new jolt.BroadPhaseLayer(0)
  const BP_LAYER_MOVING = new jolt.BroadPhaseLayer(1)
  const NUM_BROAD_PHASE_LAYERS = 2
  const bpInterface = new jolt.BroadPhaseLayerInterfaceTable(NUM_OBJECT_LAYERS, NUM_BROAD_PHASE_LAYERS)
  bpInterface.MapObjectToBroadPhaseLayer(LAYER_NON_MOVING, BP_LAYER_NON_MOVING)
  bpInterface.MapObjectToBroadPhaseLayer(LAYER_MOVING, BP_LAYER_MOVING)

  settings.mObjectLayerPairFilter = objectFilter
  settings.mBroadPhaseLayerInterface = bpInterface
  settings.mObjectVsBroadPhaseLayerFilter = new jolt.ObjectVsBroadPhaseLayerFilterTable(
    settings.mBroadPhaseLayerInterface, NUM_BROAD_PHASE_LAYERS,
    settings.mObjectLayerPairFilter, NUM_OBJECT_LAYERS
  )
}

export function createFloorBody() {
  const floorShape = new jolt.BoxShape(new jolt.Vec3(15, 0.5, 15), 0.05, null)
  const floorPos = new jolt.RVec3(0, -0.5, 0)
  const floorRot = jolt.Quat.prototype.sIdentity()
  const floorSettings = new jolt.BodyCreationSettings(
    floorShape, floorPos, floorRot, jolt.EMotionType_Static, LAYER_NON_MOVING
  )
  jolt.destroy(floorPos)
  jolt.destroy(floorRot)
  const floorBody = bodyInterface.CreateBody(floorSettings)
  bodyInterface.AddBody(floorBody.GetID(), jolt.EActivation_DontActivate)
  jolt.destroy(floorSettings)
}

export function getJolt() { return jolt }
export function getBodyInterface() { return bodyInterface }
export function getPhysicsSystem() { return physicsSystem }
export function getJoltInterface() { return joltInterface }
