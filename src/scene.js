import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { isMobile, MAX_PIXEL_RATIO, SHADOW_SIZE } from './config.js'

let scene, camera, renderer, controls

export function createScene() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200)
  camera.position.set(0, 10, 20)

  renderer = new THREE.WebGLRenderer({
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

  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 3, 0)
  controls.enableDamping = false
  controls.update()

  return { scene, camera, renderer }
}

export function addLighting() {
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
}

export function addFloor() {
  const floorGeometry = new THREE.BoxGeometry(30, 1, 30)
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a4a, roughness: 0.8, metalness: 0.2 })
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
  floorMesh.position.set(0, -0.5, 0)
  floorMesh.receiveShadow = true
  scene.add(floorMesh)

  const gridHelper = new THREE.GridHelper(30, 30, 0x4444aa, 0x333366)
  gridHelper.position.y = 0
  scene.add(gridHelper)
}

export function getScene() { return scene }
export function getCamera() { return camera }
export function getRenderer() { return renderer }
export function getControls() { return controls }

export function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}
