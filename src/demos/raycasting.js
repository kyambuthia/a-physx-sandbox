import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const SCENE_COLOR = 0x1a1a2e
const BALL_COUNT = 12
const BALL_RADIUS = 1.2
const COLORS = [0xff4444, 0xff8800, 0xffcc00, 0x44cc44, 0x4488ff, 0x8844ff, 0xff44cc, 0x00cccc, 0xcc8844, 0x66aaff, 0xff6688, 0xaa44ff]

export default async function demoRaycasting(container) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(SCENE_COLOR)

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 6, 16)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.appendChild(renderer.domElement)
  renderer.domElement.classList.add('demo-canvas')

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0, 0)
  controls.update()

  const ambientLight = new THREE.AmbientLight(0x404060, 0.6)
  scene.add(ambientLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
  dirLight.position.set(15, 20, 10)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.width = 2048
  dirLight.shadow.mapSize.height = 2048
  dirLight.shadow.camera.near = 0.1
  dirLight.shadow.camera.far = 50
  dirLight.shadow.camera.left = -20
  dirLight.shadow.camera.right = 20
  dirLight.shadow.camera.top = 20
  dirLight.shadow.camera.bottom = -20
  scene.add(dirLight)

  const floorGeometry = new THREE.BoxGeometry(30, 1, 30)
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a4a, roughness: 0.8, metalness: 0.2 })
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
  floorMesh.position.set(0, -0.5, 0)
  floorMesh.receiveShadow = true
  scene.add(floorMesh)

  const gridHelper = new THREE.GridHelper(30, 30, 0x4444aa, 0x333366)
  scene.add(gridHelper)

  const balls = []
  const ballMeshes = []

  for (let i = 0; i < BALL_COUNT; i++) {
    const x = (Math.random() - 0.5) * 16
    const z = (Math.random() - 0.5) * 16
    const geometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32)
    const material = new THREE.MeshStandardMaterial({ color: COLORS[i], roughness: 0.3, metalness: 0.4 })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, BALL_RADIUS, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.index = i
    mesh.userData.baseColor = COLORS[i]
    scene.add(mesh)
    balls.push(mesh)
    ballMeshes.push(mesh)
  }

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  const hitMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  )
  hitMarker.visible = false
  scene.add(hitMarker)

  let selectedMesh = null

  function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(ballMeshes)

    if (selectedMesh) {
      selectedMesh.material.emissive.set(0x000000)
      selectedMesh = null
    }

    if (intersects.length > 0) {
      const hit = intersects[0]
      const obj = hit.object
      obj.material.emissive.set(0x444444)
      selectedMesh = obj

      hitMarker.position.copy(hit.point)
      hitMarker.visible = true
    } else {
      hitMarker.visible = false
    }
  }

  window.addEventListener('click', onClick)

  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', onResize)

  function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()
}
