import Jolt from 'jolt-physics'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const LAYER_NON_MOVING = 0
const LAYER_MOVING = 1
const NUM_OBJECT_LAYERS = 2

const BALL_COUNT = 20
const SPAWN_INTERVAL = 0.15
const BALL_RADIUS_MIN = 0.3
const BALL_RADIUS_MAX = 0.8
const SPAWN_HEIGHT = 12
const SPAWN_RADIUS = 8
const TIME_STEP = 1 / 60

const COLORS = [
  0xff4444, 0xff8800, 0xffcc00, 0x44cc44, 0x4488ff,
  0x8844ff, 0xff44cc, 0x00cccc, 0xcc8844, 0x66aaff,
  0xff6688, 0x88ff44, 0xaa44ff, 0xffaa44, 0x44ffaa,
  0xff4466, 0x6688ff, 0xcc66ff, 0x66ffcc, 0xffcc66,
]

const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768
const MAX_PIXEL_RATIO = isMobile ? 1.5 : 2
const SHADOW_SIZE = isMobile ? 1024 : 2048
const SPHERE_SEGMENTS = isMobile ? 16 : 24

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a1a2e)

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200)
camera.position.set(0, 10, 20)

const renderer = new THREE.WebGLRenderer({
  antialias: !isMobile,
  powerPreference: 'high-performance',
  depth: true,
  stencil: false,
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 3, 0)
controls.enableDamping = false
controls.update()

const ambientLight = new THREE.AmbientLight(0x404060, 0.6)
scene.add(ambientLight)
const dirLight = new THREE.DirectionalLight(0xffffff, isMobile ? 0.9 : 1.2)
dirLight.position.set(15, 20, 10)
dirLight.castShadow = true
dirLight.shadow.mapSize.width = SHADOW_SIZE
dirLight.shadow.mapSize.height = SHADOW_SIZE
dirLight.shadow.camera.near = 0.1
dirLight.shadow.camera.far = 50
dirLight.shadow.camera.left = -20
dirLight.shadow.camera.right = 20
dirLight.shadow.camera.top = 20
dirLight.shadow.camera.bottom = -20
scene.add(dirLight)
const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3)
fillLight.position.set(-10, 5, -10)
scene.add(fillLight)

const floorGeometry = new THREE.BoxGeometry(30, 1, 30)
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a4a, roughness: 0.8, metalness: 0.2 })
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
floorMesh.position.set(0, -0.5, 0)
floorMesh.receiveShadow = true
scene.add(floorMesh)

const gridHelper = new THREE.GridHelper(30, 30, 0x4444aa, 0x333366)
gridHelper.position.y = 0
scene.add(gridHelper)

let jolt, bodyInterface, physicsSystem
const balls = []
let spawnTimer = 0
let ballCount = 0

function spawnBall() {
  if (ballCount >= BALL_COUNT) return

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

  balls.push({ body, mesh })
  ballCount++
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

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

async function init() {
  jolt = await Jolt()

  const joltSettings = new jolt.JoltSettings()
  joltSettings.mMaxWorkerThreads = 2
  setupCollisionFiltering(joltSettings)

  const joltInterface = new jolt.JoltInterface(joltSettings)
  jolt.destroy(joltSettings)
  physicsSystem = joltInterface.GetPhysicsSystem()
  bodyInterface = physicsSystem.GetBodyInterface()

  const floorShape = new jolt.BoxShape(new jolt.Vec3(15, 0.5, 15), 0.05, null)
  const floorPos = new jolt.RVec3(0, -0.5, 0)
  const floorRot = jolt.Quat.prototype.sIdentity()
  const floorSettings = new jolt.BodyCreationSettings(floorShape, floorPos, floorRot, jolt.EMotionType_Static, LAYER_NON_MOVING)
  jolt.destroy(floorPos)
  jolt.destroy(floorRot)
  const floorBody = bodyInterface.CreateBody(floorSettings)
  bodyInterface.AddBody(floorBody.GetID(), jolt.EActivation_DontActivate)
  jolt.destroy(floorSettings)

  for (let i = 0; i < 8; i++) {
    spawnBall()
  }

  onResize()
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', () => setTimeout(onResize, 150))

  function animate() {
    requestAnimationFrame(animate)

    const delta = TIME_STEP

    spawnTimer += delta
    if (spawnTimer >= SPAWN_INTERVAL && ballCount < BALL_COUNT) {
      spawnTimer = 0
      spawnBall()
    }

    joltInterface.Step(delta, 1)

    for (let i = balls.length - 1; i >= 0; i--) {
      const { body, mesh } = balls[i]
      const pos = body.GetPosition()
      mesh.position.set(pos.GetX(), pos.GetY(), pos.GetZ())
      const rot = body.GetRotation()
      mesh.quaternion.set(rot.GetX(), rot.GetY(), rot.GetZ(), rot.GetW())
    }
    controls.update()
    renderer.render(scene, camera)
  }

  animate()
}

init()
