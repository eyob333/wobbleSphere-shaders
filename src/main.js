import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js'
import customShaderMaterial from "three-custom-shader-material/vanilla"
import GUI from 'lil-gui'
import wobbleVertexShader from './shaders/wobble/vertex.glsl'
import wobbleFragmentShader from './shaders/wobble/fragment.glsl'


/**
 * Base
 */
// Debug
const gui = new GUI({ width: 325 }).close()
const debugObject = {}

debugObject.colorA = '#0000ff'
debugObject.colorB = '#ff0000'


// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const rgbeLoader = new RGBELoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('./draco/')
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Environment map
 */
rgbeLoader.load('./urban_alley_01_1k.hdr', (environmentMap) =>
{
    environmentMap.mapping = THREE.EquirectangularReflectionMapping
    scene.background = environmentMap
    scene.environment = environmentMap
})

/**
 * Wobble
 */
// Material

// uniforms
const uniforms = {
    uTime: new THREE.Uniform(0),
    uTimeFrequency: new THREE.Uniform(.4),
    uPositionFrequency: new THREE.Uniform(.5),
    uStrength: new THREE.Uniform(.3),
    uWrapTimeFrequency: new THREE.Uniform(.12),
    uWrapPositionFrequency: new THREE.Uniform(.38),
    uWrapStrength: new THREE.Uniform(1.7),
    uColorA: new THREE.Uniform( new THREE.Color(debugObject.colorA)),
    uColorB: new THREE.Uniform( new THREE.Color(debugObject.colorB))


}


const material = new customShaderMaterial({
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader: wobbleVertexShader,
    fragmentShader: wobbleFragmentShader,   
    uniforms: uniforms,
    metalness: 0,
    roughness: 0.5,
    color: '#ffffff',
    transmission: 0,
    ior: 1.5,
    thickness: 1.5,
    transparent: true,
    wireframe: false,
})

const depthMaterial = new customShaderMaterial({
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader: wobbleVertexShader,
    uniforms: uniforms,
    depthPacking: THREE.RGBADepthPacking
})


// Tweaks
gui.add(uniforms.uTimeFrequency, 'value').min(0).max(2).step(.001).name('uTimeFrequency')
gui.add(uniforms.uStrength, 'value').min(0).max(2).step(.001).name('uStrength')
gui.add(uniforms.uPositionFrequency, 'value').min(0).max(2).step(.001).name('uPostionFrequency')

gui.add(uniforms.uWrapTimeFrequency, 'value').min(0).max(2).step(.001).name('uWrapTimeFrequency')
gui.add(uniforms.uWrapStrength, 'value').min(0).max(2).step(.001).name('uWarpStrength')
gui.add(uniforms.uWrapPositionFrequency, 'value').min(0).max(2).step(.001).name('uWarpPostionFrequency')

gui.addColor( debugObject, 'colorA')
    .onChange( () => {
        uniforms.uColorA.value.set(debugObject.colorA)
    })

gui.addColor( debugObject, 'colorB')
    .onChange( () => {
        uniforms.uColorB.value.set(debugObject.colorB)
    })


gui.add(material, 'metalness', 0, 1, 0.001)
gui.add(material, 'roughness', 0, 1, 0.001)
gui.add(material, 'transmission', 0, 1, 0.001)
gui.add(material, 'ior', 0, 10, 0.001)
gui.add(material, 'thickness', 0, 10, 0.001)
// gui.addColor(material, 'color')



// Geometry
let geometry = new THREE.IcosahedronGeometry(2.5, 50)
geometry = mergeVertices(geometry)
geometry.computeTangents()
// console.log(geometry.attributes)


// gltf model

gltfLoader.load( 'suzanne.glb', (model) =>{
    const wobble = model.scene.children[0]
    wobble.castShadow = true
    wobble.receiveShadow = true
    wobble.material = material
    wobble.customDepthMaterial = depthMaterial
    scene.add(wobble)
}, () => {
    console.log('loading the model')
})

// Mesh
// const wobble = new THREE.Mesh(geometry, material)
// wobble.customDepthMaterial = depthMaterial
// wobble.receiveShadow = true
// wobble.castShadow = true
// scene.add(wobble)

/**
 * Plane
 */
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 15, 15),
    new THREE.MeshStandardMaterial()
)
plane.receiveShadow = true
plane.rotation.y = Math.PI
plane.position.y = - 5
plane.position.z = 5
scene.add(plane)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 2, - 2.25)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(13, - 3, - 5)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    //update uniforms

    uniforms.uTime.value = elapsedTime

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()