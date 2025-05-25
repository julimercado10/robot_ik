"use client"

import { useEffect, useRef, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RobotVisualization } from "@/components/robot-visualization"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Importar las funciones de cinemática
import { inverseKinematics, DH_template, workspace_dict } from "@/lib/kinematics"

export default function Home() {
  // Estado para el DOF seleccionado
  const [dof, setDof] = useState(7)

  // Estado para la posición y orientación objetivo
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0.3 })
  const [orientation, setOrientation] = useState({ roll: 0, pitch: 0, yaw: 0 })

  // Estado para los ángulos de las articulaciones
  const [jointAngles, setJointAngles] = useState<number[]>(Array(7).fill(0))

  // Estado para el estado de la solución IK
  const [ikStatus, setIkStatus] = useState({ solved: true, time: 0 })

  // Referencia para evitar cálculos innecesarios
  const prevSolutionRef = useRef<number[]>(Array(7).fill(0))

  // Referencia para evitar actualizaciones en cascada
  const isUpdatingRef = useRef(false)

  // Obtener los parámetros DH para el DOF actual
  const DH_params = DH_template.slice(0, dof)

  // Obtener los límites del espacio de trabajo para el DOF actual
  const workspace = workspace_dict[dof as keyof typeof workspace_dict]
  const { x_min, x_max, y_min, y_max, z_min, z_max } = workspace

  // Calcular los límites simétricos para los sliders
  const x_range = Math.max(Math.abs(x_min), Math.abs(x_max))
  const y_range = Math.max(Math.abs(y_min), Math.abs(y_max))

  // Función para calcular los ángulos de las articulaciones
  const calculateJointAngles = () => {
    if (isUpdatingRef.current) return

    isUpdatingRef.current = true

    try {
      // Usar las coordenadas directamente como en el código original
      const targetPos = [position.x, position.y, position.z]

      // Crear matrices de rotación a partir de ángulos de Euler
      const roll = orientation.roll
      const pitch = orientation.pitch
      const yaw = orientation.yaw

      const Rx = [
        [1, 0, 0],
        [0, Math.cos(roll), -Math.sin(roll)],
        [0, Math.sin(roll), Math.cos(roll)],
      ]

      const Ry = [
        [Math.cos(pitch), 0, Math.sin(pitch)],
        [0, 1, 0],
        [-Math.sin(pitch), 0, Math.cos(pitch)],
      ]

      const Rz = [
        [Math.cos(yaw), -Math.sin(yaw), 0],
        [Math.sin(yaw), Math.cos(yaw), 0],
        [0, 0, 1],
      ]

      // Combinar matrices de rotación (Rz * Ry * Rx)
      const multiplyMatrices = (a: number[][], b: number[][]) => {
        return a.map((row, i) => b[0].map((_, j) => row.reduce((sum, elm, k) => sum + elm * b[k][j], 0)))
      }

      const Rzy = multiplyMatrices(Rz, Ry)
      const targetRot = multiplyMatrices(Rzy, Rx)

      // Verificar que DH_params tenga datos válidos
      if (!DH_params || DH_params.length === 0) {
        console.error("DH_params no es válido:", DH_params)
        isUpdatingRef.current = false
        return
      }

      // Resolver cinemática inversa
      const startTime = performance.now()
      const result = inverseKinematics(
        targetPos,
        targetRot,
        prevSolutionRef.current.slice(0, dof),
        300,
        1e-3,
        0.05,
        0.8,
        dof,
        DH_params,
      )

      // Si el primer intento falla, probar con ceros como suposición inicial
      let solution = result.q
      let solved = result.success

      if (!solved) {
        const fallbackResult = inverseKinematics(
          targetPos,
          targetRot,
          Array(dof).fill(0),
          800,
          1e-4,
          0.01,
          0.5,
          dof,
          DH_params,
        )
        solution = fallbackResult.q
        solved = fallbackResult.success
      }

      const endTime = performance.now()

      if (solved && solution) {
        // Crear un nuevo array con el tamaño correcto
        const newJointAngles = Array(dof).fill(0)
        for (let i = 0; i < dof; i++) {
          newJointAngles[i] = solution[i]
        }

        setJointAngles(newJointAngles)

        // Actualizar la referencia con el tamaño correcto
        const newPrevSolution = Array(7).fill(0)
        for (let i = 0; i < dof; i++) {
          newPrevSolution[i] = solution[i]
        }
        prevSolutionRef.current = newPrevSolution

        setIkStatus({
          solved: true,
          time: (endTime - startTime) / 1000,
        })
      } else {
        setIkStatus({
          solved: false,
          time: (endTime - startTime) / 1000,
        })
      }
    } catch (error) {
      console.error("Error al calcular los ángulos de las articulaciones:", error)
      setIkStatus({
        solved: false,
        time: 0,
      })
    } finally {
      isUpdatingRef.current = false
    }
  }

  // Efecto para recalcular los ángulos cuando cambia la posición o la orientación
  useEffect(() => {
    calculateJointAngles()
  }, [position, orientation, dof])

  // Efecto para ajustar la posición cuando cambia el DOF
  useEffect(() => {
    // Asegurarse de que la posición esté dentro del espacio de trabajo
    const newPosition = { ...position }
    let positionChanged = false

    if (newPosition.x < -x_range) {
      newPosition.x = -x_range
      positionChanged = true
    }
    if (newPosition.x > x_range) {
      newPosition.x = x_range
      positionChanged = true
    }

    if (newPosition.y < -y_range) {
      newPosition.y = -y_range
      positionChanged = true
    }
    if (newPosition.y > y_range) {
      newPosition.y = y_range
      positionChanged = true
    }

    if (newPosition.z < z_min) {
      newPosition.z = z_min
      positionChanged = true
    }
    if (newPosition.z > z_max) {
      newPosition.z = z_max
      positionChanged = true
    }

    // Solo actualizar la posición si realmente cambió
    if (positionChanged) {
      setPosition(newPosition)
    }

    // Reiniciar los ángulos de las articulaciones
    prevSolutionRef.current = Array(7).fill(0)
  }, [dof, x_range, y_range, z_min, z_max])

  // Manejar cambios en los sliders
  const handlePositionChange = (axis: "x" | "y" | "z", value: number[]) => {
    setPosition((prev) => ({ ...prev, [axis]: value[0] }))
  }

  const handleOrientationChange = (axis: "roll" | "pitch" | "yaw", value: number[]) => {
    setOrientation((prev) => ({ ...prev, [axis]: value[0] }))
  }

  // Manejar cambio de DOF
  const handleDofChange = (value: string) => {
    setDof(Number.parseInt(value))
  }

  return (
    <main className="min-h-screen p-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">
              Visualización Cinemática del Brazo Robótico
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Visualización interactiva en 3D de la cinemática del brazo del robot con cálculo de la cinemática inversa.
            </p>
          </div>
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-2rem)]">
          {/* Panel de controles - más compacto */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Controles del Brazo Robótico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* DOF Selection */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Grados de Libertad (DOF)</Label>
                  <Select value={dof.toString()} onValueChange={handleDofChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 DOF</SelectItem>
                      <SelectItem value="3">3 DOF</SelectItem>
                      <SelectItem value="4">4 DOF</SelectItem>
                      <SelectItem value="5">5 DOF</SelectItem>
                      <SelectItem value="6">6 DOF</SelectItem>
                      <SelectItem value="7">7 DOF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Position */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Controles de Posición</Label>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Posición X</Label>
                      <span className="text-sm font-mono">{position.x.toFixed(2)}</span>
                    </div>
                    <Slider
                      min={-x_range}
                      max={x_range}
                      step={0.01}
                      value={[position.x]}
                      onValueChange={(value) => handlePositionChange("x", value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Posición Y</Label>
                      <span className="text-sm font-mono">{position.y.toFixed(2)}</span>
                    </div>
                    <Slider
                      min={-y_range}
                      max={y_range}
                      step={0.01}
                      value={[position.y]}
                      onValueChange={(value) => handlePositionChange("y", value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Posición Z</Label>
                      <span className="text-sm font-mono">{position.z.toFixed(2)}</span>
                    </div>
                    <Slider
                      min={z_min}
                      max={z_max}
                      step={0.01}
                      value={[position.z]}
                      onValueChange={(value) => handlePositionChange("z", value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Target Orientation */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Controles de Orientación</Label>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Roll</Label>
                      <span className="text-sm font-mono">{orientation.roll.toFixed(2)} rad</span>
                    </div>
                    <Slider
                      min={-Math.PI}
                      max={Math.PI}
                      step={0.01}
                      value={[orientation.roll]}
                      onValueChange={(value) => handleOrientationChange("roll", value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Pitch</Label>
                      <span className="text-sm font-mono">{orientation.pitch.toFixed(2)} rad</span>
                    </div>
                    <Slider
                      min={-Math.PI}
                      max={Math.PI}
                      step={0.01}
                      value={[orientation.pitch]}
                      onValueChange={(value) => handleOrientationChange("pitch", value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Yaw</Label>
                      <span className="text-sm font-mono">{orientation.yaw.toFixed(2)} rad</span>
                    </div>
                    <Slider
                      min={-Math.PI}
                      max={Math.PI}
                      step={0.01}
                      value={[orientation.yaw]}
                      onValueChange={(value) => handleOrientationChange("yaw", value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    La visualización se actualiza automáticamente al mover los controles
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visualización */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <RobotVisualization
                  key={`robot-${dof}`}
                  jointAngles={jointAngles}
                  targetPosition={[position.x, position.y, position.z]}
                  dhParams={DH_params}
                  workspaceLimits={workspace}
                  dof={dof}
                  ikStatus={ikStatus}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
