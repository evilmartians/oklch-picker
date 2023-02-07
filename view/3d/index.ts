/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { BackSide, BoxGeometry, BufferAttribute, BufferGeometry, BufferGeometryUtils, DirectionalLight, DoubleSide, Int32BufferAttribute, Mesh, MeshBasicMaterial, MeshNormalMaterial, Object3D, OrthographicCamera, PerspectiveCamera, Scene, Uint32BufferAttribute, WebGLRenderer } from "three"

import { pixelRation } from "../../lib/screen"
import { generateColorSpaceVertices } from "../../lib/generate-color-space"

const plotCanvases = document.querySelectorAll<HTMLCanvasElement>('.plot-test')

plotCanvases.forEach(initPlot)

function makeCloud() {
  let mesh = generateColorSpaceVertices()
  let origin = new Object3D()

  console.log(mesh);

  let floatTris = new Float32Array(
    mesh.vertices
      .map(v => [v.x, v.y, v.z])
      .flat()
  )

  let geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new BufferAttribute(floatTris, 3)
  )
  geometry.setIndex(new Uint32BufferAttribute(mesh.indices, 1))
  geometry.computeVertexNormals()

  let trisMesh = new Mesh(
    geometry,
    new MeshNormalMaterial({side: BackSide, vertexColors: true})
  )

  origin.add(trisMesh)
  trisMesh.position.x -= 1/2
  trisMesh.position.y -= 1/2
  trisMesh.position.z -= 1/2

  return origin
}

function initPlot(canvas: HTMLCanvasElement) {
  canvas.width = 500
  canvas.height = 500
  canvas.style.backgroundColor = '#999999'

  let glCtx = canvas.getContext('webgl')
  if (!glCtx) return

  let renderer = new WebGLRenderer({
    canvas,
    context: glCtx,
  })
  renderer.pixelRatio = pixelRation

  // Scene elements
  let scene = new Scene()

  let light = new DirectionalLight('#fff', 1)
  light.rotateX(45)

  let cam = new PerspectiveCamera()

  let cloud = makeCloud()
  // let cloud = new Object3D()
  cloud.position.setZ(-2)

  // Assemble scene
  scene.add(cam)
  scene.add(light)
  scene.add(cloud)

  document.addEventListener('mousemove', e => {
    cloud.rotation.y = e.clientX / 100
    cloud.rotation.x = e.clientY / 100
  })

  renderer.setAnimationLoop(() => {
    // cloud.rotation.y += 0.02
    // cloud.rotation.y += 1 * (1 / 360) * Math.PI

    renderer.render(scene, cam)
  })
}
