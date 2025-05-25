"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { transformationMatrix, forwardKinematics } from "@/lib/kinematics"
import { Badge } from "@/components/ui/badge"

interface RobotVisualizationProps {
  jointAngles: number[]
  targetPosition: number[]
  dhParams: number[][]
  workspaceLimits: {
    x_min: number
    x_max: number
    y_min: number
    y_max: number
    z_min: number
    z_max: number
  }
  dof: number
  ikStatus: {
    solved: boolean
    time: number
  }
}

export function RobotVisualization({
  jointAngles,
  targetPosition,
  dhParams,
  workspaceLimits,
  dof,
  ikStatus,
}: RobotVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const robotRef = useRef<THREE.Group | null>(null)
  const frameRef = useRef<THREE.Group | null>(null)
  const targetRef = useRef<THREE.Mesh | null>(null)
  const gridRef = useRef<THREE.GridHelper | null>(null)
  const axesRef = useRef<THREE.AxesHelper | null>(null)
  const requestRef = useRef<number | null>(null)
  const animationRef = useRef<number | null>(null)
  const workspaceMeshRef = useRef<THREE.Mesh | null>(null)
  const axisLabelsRef = useRef<THREE.Sprite[]>([])

  // Initialize the scene
  useEffect(() => {
    if (!containerRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f5)
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.set(1, 1, 1)
    cameraRef.current = camera

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controlsRef.current = controls

    // Create robot group
    const robotGroup = new THREE.Group()
    scene.add(robotGroup)
    robotRef.current = robotGroup

    // Create end-effector frame group
    const frameGroup = new THREE.Group()
    scene.add(frameGroup)
    frameRef.current = frameGroup

    // Create target sphere (más grande y con material más visible)
    const targetGeometry = new THREE.SphereGeometry(0.05, 32, 32)
    const targetMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.2,
    })
    const targetSphere = new THREE.Mesh(targetGeometry, targetMaterial)
    scene.add(targetSphere)
    targetRef.current = targetSphere

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)

    // Animation loop for rendering
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return

      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight

      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()

      rendererRef.current.setSize(width, height)
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }

      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Separate effect for target animation
  useEffect(() => {
    if (!targetRef.current) return

    // Función para animar el punto objetivo
    const animateTarget = () => {
      if (targetRef.current) {
        const scale = 1 + 0.2 * Math.sin(Date.now() * 0.005)
        targetRef.current.scale.set(scale, scale, scale)
      }
      animationRef.current = requestAnimationFrame(animateTarget)
    }

    // Iniciar la animación
    animationRef.current = requestAnimationFrame(animateTarget)

    // Limpiar al desmontar
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [])

  // Update grid and axes when workspace limits change
  useEffect(() => {
    if (!sceneRef.current) return

    // Remove previous grid, axes, workspace mesh, and labels
    if (gridRef.current) {
      sceneRef.current.remove(gridRef.current)
    }

    if (axesRef.current) {
      sceneRef.current.remove(axesRef.current)
    }

    if (workspaceMeshRef.current) {
      sceneRef.current.remove(workspaceMeshRef.current)
    }

    // Remove previous axis labels
    axisLabelsRef.current.forEach((label) => {
      if (sceneRef.current) {
        sceneRef.current.remove(label)
      }
    })
    axisLabelsRef.current = []

    // Create new grid with 0.25 distance between lines
    const gridSize =
      Math.max(
        Math.abs(workspaceLimits.x_max),
        Math.abs(workspaceLimits.x_min),
        Math.abs(workspaceLimits.y_max),
        Math.abs(workspaceLimits.y_min),
      ) * 2

    const gridDivisions = Math.ceil(gridSize / 0.25)

    // Crear el grid en el plano XY (intercambiando Y y Z)
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x888888, 0xcccccc)
    // Rotar el grid para que esté en el plano XY
    gridHelper.rotation.x = Math.PI / 2
    sceneRef.current.add(gridHelper)
    gridRef.current = gridHelper

    // Create larger and more visible axes
    const axesHelper = new THREE.AxesHelper(1)
    sceneRef.current.add(axesHelper)
    axesRef.current = axesHelper

    // Create labels for axes
    const createAxisLabel = (text: string, position: THREE.Vector3, color: number) => {
      const canvas = document.createElement("canvas")
      canvas.width = 64
      canvas.height = 32
      const context = canvas.getContext("2d")
      if (context) {
        context.fillStyle = `#${color.toString(16).padStart(6, "0")}`
        context.font = "Bold 24px Arial"
        context.fillText(text, 8, 24)

        const texture = new THREE.CanvasTexture(canvas)
        const material = new THREE.SpriteMaterial({ map: texture })
        const sprite = new THREE.Sprite(material)
        sprite.position.copy(position)
        sprite.scale.set(0.2, 0.1, 1)
        sceneRef.current?.add(sprite)
        axisLabelsRef.current.push(sprite)
      }
    }

    createAxisLabel("X", new THREE.Vector3(1.1, 0, 0), 0xff0000)
    createAxisLabel("Y", new THREE.Vector3(0, 1.1, 0), 0x00ff00)
    createAxisLabel("Z", new THREE.Vector3(0, 0, 1.1), 0x0000ff)

    // Create workspace boundaries
    const { x_min, x_max, y_min, y_max, z_min, z_max } = workspaceLimits
    const workspaceGeometry = new THREE.BoxGeometry(x_max - x_min, y_max - y_min, z_max - z_min)
    const workspaceMaterial = new THREE.MeshBasicMaterial({
      color: 0x88aaff,
      transparent: true,
      opacity: 0.1,
      wireframe: true,
    })
    const workspaceMesh = new THREE.Mesh(workspaceGeometry, workspaceMaterial)
    workspaceMesh.position.set((x_max + x_min) / 2, (y_max + y_min) / 2, (z_max + z_min) / 2)
    sceneRef.current.add(workspaceMesh)
    workspaceMeshRef.current = workspaceMesh
  }, [workspaceLimits])

  // Update target position
  useEffect(() => {
    if (!targetRef.current) return
    targetRef.current.position.set(targetPosition[0], targetPosition[1], targetPosition[2])
  }, [targetPosition])

  // Update robot visualization when joint angles change
  useEffect(() => {
    if (!robotRef.current || !frameRef.current || !dhParams || !jointAngles) return

    // Verificar que dhParams y jointAngles tengan datos válidos
    if (dhParams.length === 0 || jointAngles.length === 0) return

    // Clear previous robot visualization
    while (robotRef.current.children.length > 0) {
      robotRef.current.remove(robotRef.current.children[0])
    }

    // Clear previous frame visualization
    while (frameRef.current.children.length > 0) {
      frameRef.current.remove(frameRef.current.children[0])
    }

    // Calculate forward kinematics
    const points = []
    const T = new THREE.Matrix4().identity()
    points.push(new THREE.Vector3(0, 0, 0))

    // Create material for links
    const linkMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a6dd9,
      metalness: 0.5,
      roughness: 0.5,
    })

    // Create material for joints
    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7,
      roughness: 0.3,
    })

    // Asegurarse de que solo iteramos hasta el mínimo entre jointAngles.length y dhParams.length
    const iterationLimit = Math.min(jointAngles.length, dhParams.length)

    for (let i = 0; i < iterationLimit; i++) {
      // Verificar que dhParams[i] existe y tiene al menos 4 elementos
      if (!dhParams[i] || dhParams[i].length < 4) continue

      const theta = jointAngles[i] + dhParams[i][0]
      const d = dhParams[i][1]
      const a = dhParams[i][2]
      const alpha = dhParams[i][3]

      // Create transformation matrix
      const tm = transformationMatrix(theta, d, a, alpha)
      const threeMatrix = new THREE.Matrix4().set(
        tm[0][0],
        tm[0][1],
        tm[0][2],
        tm[0][3],
        tm[1][0],
        tm[1][1],
        tm[1][2],
        tm[1][3],
        tm[2][0],
        tm[2][1],
        tm[2][2],
        tm[2][3],
        tm[3][0],
        tm[3][1],
        tm[3][2],
        tm[3][3],
      )

      // Apply transformation
      T.multiply(threeMatrix)

      // Extract position
      const position = new THREE.Vector3()
      position.setFromMatrixPosition(T)
      points.push(position.clone())

      // Create joint
      const jointGeometry = new THREE.SphereGeometry(0.025, 16, 16)
      const joint = new THREE.Mesh(jointGeometry, jointMaterial)
      joint.position.copy(position)
      robotRef.current.add(joint)
    }

    // Create links between joints
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i]
      const end = points[i + 1]

      // Calculate direction and length
      const direction = new THREE.Vector3().subVectors(end, start)
      const length = direction.length()

      // Create cylinder geometry
      const linkGeometry = new THREE.CylinderGeometry(0.015, 0.015, length, 8)
      linkGeometry.translate(0, length / 2, 0)

      const link = new THREE.Mesh(linkGeometry, linkMaterial)

      // Position and orient the link
      link.position.copy(start)
      link.lookAt(end)
      link.rotateX(Math.PI / 2)

      robotRef.current.add(link)
    }

    // Draw coordinate frame at the end-effector
    if (points.length > 1) {
      const endPosition = points[points.length - 1]

      try {
        // Calculate end-effector rotation matrix
        const [_, R] = forwardKinematics(jointAngles.slice(0, dhParams.length), dhParams)

        // Create axes for the end-effector frame
        const axisLength = 0.15
        const axisRadius = 0.008

        // X-axis (red)
        const xAxisGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength, 8)
        xAxisGeometry.translate(0, axisLength / 2, 0)
        const xAxis = new THREE.Mesh(xAxisGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }))
        xAxis.position.copy(endPosition)
        xAxis.lookAt(
          endPosition.x + R[0][0] * axisLength,
          endPosition.y + R[1][0] * axisLength,
          endPosition.z + R[2][0] * axisLength,
        )
        xAxis.rotateX(Math.PI / 2)
        frameRef.current.add(xAxis)

        // Y-axis (green)
        const yAxisGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength, 8)
        yAxisGeometry.translate(0, axisLength / 2, 0)
        const yAxis = new THREE.Mesh(yAxisGeometry, new THREE.MeshBasicMaterial({ color: 0x00ff00 }))
        yAxis.position.copy(endPosition)
        yAxis.lookAt(
          endPosition.x + R[0][1] * axisLength,
          endPosition.y + R[1][1] * axisLength,
          endPosition.z + R[2][1] * axisLength,
        )
        yAxis.rotateX(Math.PI / 2)
        frameRef.current.add(yAxis)

        // Z-axis (blue)
        const zAxisGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength, 8)
        zAxisGeometry.translate(0, axisLength / 2, 0)
        const zAxis = new THREE.Mesh(zAxisGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff }))
        zAxis.position.copy(endPosition)
        zAxis.lookAt(
          endPosition.x + R[0][2] * axisLength,
          endPosition.y + R[1][2] * axisLength,
          endPosition.z + R[2][2] * axisLength,
        )
        zAxis.rotateX(Math.PI / 2)
        frameRef.current.add(zAxis)
      } catch (error) {
        console.error("Error al dibujar el marco de coordenadas:", error)
      }
    }
  }, [jointAngles, dhParams])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Información de estado superpuesta */}
      <div className="absolute top-4 right-4 space-y-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Estado:</span>
              {ikStatus.solved ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Solución Encontrada
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Sin Solución
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Tiempo:</span>
              <span className="text-sm font-mono">{ikStatus.time.toFixed(3)}s</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">DOF:</span>
              <span className="text-sm font-mono">{dof}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <div className="space-y-1">
            <div className="text-sm font-medium mb-2">Posición Objetivo:</div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>X:</span>
                <span className="font-mono">{targetPosition[0].toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span>Y:</span>
                <span className="font-mono">{targetPosition[1].toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span>Z:</span>
                <span className="font-mono">{targetPosition[2].toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
