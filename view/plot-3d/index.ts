/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { AmbientLight, BackSide, BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Scene, Uint32BufferAttribute, Vector3, WebGLRenderer } from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { pixelRation } from "../../lib/screen.js"
import { MeshData } from "../../tools/color-shapes/mesh.js"
import { makeColorShapeFileName } from "../../tools/color-shapes/shape-name.js"

async function makeShape() {
  let resp = await fetch(`/shapes/${makeColorShapeFileName('oklch', 'rec2020')}`)
  let meshData = await resp.json() as MeshData

  let origin = new Object3D()
  let geometry = new BufferGeometry()

  let vertices = new Float32Array(meshData.vertices)
  let colors = new Uint8Array(
    meshData.colors.map(c => c * 255)
  )

  geometry.setAttribute(
    'position',
    new BufferAttribute(vertices, 3)
  )
  geometry.setAttribute(
    'color',
    new BufferAttribute(colors, 3, true)
  )
  geometry.setIndex(new Uint32BufferAttribute(meshData.indices, 1))
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()

  let mesh = new Mesh(
    geometry,
    new MeshBasicMaterial({
      side: BackSide,
      vertexColors: true,
      fog: false,
    })
  )

  origin.add(mesh)

  let size = new Vector3()
  geometry.boundingBox?.getSize(size)

  mesh.position.x = -size.x / 2
  mesh.position.y = -size.y / 2
  mesh.position.z = -size.z / 2

  origin.scale.z *= 1.5

  return origin
}

async function initPlot(canvas: HTMLCanvasElement) {
  canvas.width = 500
  canvas.height = 500

  let glCtx = canvas.getContext('webgl')
  if (!glCtx) return

  let renderer = new WebGLRenderer({
    canvas,
    context: glCtx,
  })
  renderer.pixelRatio = pixelRation

  // Scene elements
  let scene = new Scene()

  let light = new AmbientLight('#fff', 1)

  let cam = new PerspectiveCamera()

  let model = await makeShape()

  // Orbital controls
  let orbit = new OrbitControls(cam, renderer.domElement)
  orbit.addEventListener('change', render)
  orbit.screenSpacePanning = false;
  orbit.minDistance = 1;
  orbit.maxDistance = 3;
  orbit.maxPolarAngle = Math.PI;
  orbit.enablePan = false

  // Cam init pos
  cam.position.x = -1.5
  cam.position.z = 1.5
  cam.position.y = 1

  // Assemble scene
  scene.add(cam)
  scene.add(light)
  scene.add(model)

  function render() {
    renderer.render(scene, cam)
  }

  orbit.update()
  render()
}

const plotCanvases = document.querySelectorAll<HTMLCanvasElement>('.plot-3d')
plotCanvases.forEach(initPlot)
