export const DOF = 7 // Grados de Libertad

// DH parameters template
export const DH_template = [
  [0, 0.3, 0.0, Math.PI / 2],
  [0, 0.0, 0.3, 0],
  [0, 0.0, 0.3, Math.PI / 2],
  [0, 0.3, 0.0, -Math.PI / 2],
  [0, 0.0, 0.3, Math.PI / 2],
  [0, 0.0, 0.3, -Math.PI / 2],
  [0, 0.3, 0.0, 0],
]

// Workspace dictionary
export const workspace_dict = {
  2: { x_min: -0.4, x_max: 0.4, y_min: -0.4, y_max: 0.4, z_min: 0.3, z_max: 0.8 },
  3: { x_min: -0.5, x_max: 0.5, y_min: -0.5, y_max: 0.5, z_min: 0.3, z_max: 1.0 },
  4: { x_min: -0.6, x_max: 0.6, y_min: -0.6, y_max: 0.6, z_min: 0.3, z_max: 1.1 },
  5: { x_min: -0.7, x_max: 0.7, y_min: -0.7, y_max: 0.7, z_min: 0.3, z_max: 1.2 },
  6: { x_min: -0.8, x_max: 0.8, y_min: -0.8, y_max: 0.8, z_min: 0.3, z_max: 1.3 },
  7: { x_min: -1.0, x_max: 1.0, y_min: -1.0, y_max: 1.0, z_min: 0.3, z_max: 1.5 },
}

// Transformation matrix function
export function transformationMatrix(theta: number, d: number, a: number, alpha: number) {
  const ct = Math.cos(theta)
  const st = Math.sin(theta)
  const ca = Math.cos(alpha)
  const sa = Math.sin(alpha)

  return [
    [ct, -st * ca, st * sa, a * ct],
    [st, ct * ca, -ct * sa, a * st],
    [0, sa, ca, d],
    [0, 0, 0, 1],
  ]
}

// Forward kinematics function
export function forwardKinematics(q: number[], DH_params: number[][]) {
  let T = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ]

  for (let i = 0; i < q.length; i++) {
    // Verificar que DH_params[i] existe antes de acceder a él
    if (!DH_params[i]) continue

    const theta = q[i] + DH_params[i][0]
    const d = DH_params[i][1]
    const a = DH_params[i][2]
    const alpha = DH_params[i][3]

    const Ti = transformationMatrix(theta, d, a, alpha)
    T = multiplyMatrices(T, Ti)
  }

  // Extract position and rotation
  const position = [T[0][3], T[1][3], T[2][3]]
  const rotation = [
    [T[0][0], T[0][1], T[0][2]],
    [T[1][0], T[1][1], T[1][2]],
    [T[2][0], T[2][1], T[2][2]],
  ]

  return [position, rotation] as const
}

// Matrix multiplication helper
function multiplyMatrices(a: number[][], b: number[][]) {
  const result = Array(a.length)
    .fill(0)
    .map(() => Array(b[0].length).fill(0))

  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b[0].length; j++) {
      for (let k = 0; k < a[0].length; k++) {
        result[i][j] += a[i][k] * b[k][j]
      }
    }
  }

  return result
}

// Damped pseudoinverse function
function dampedPseudoinverse(J: number[][], damping = 0.01) {
  // J is m x n matrix
  const m = J.length
  const n = J[0].length

  // Calculate J * J^T
  const JJt = Array(m)
    .fill(0)
    .map(() => Array(m).fill(0))

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < n; k++) {
        JJt[i][j] += J[i][k] * J[j][k]
      }
    }
  }

  // Add damping term to diagonal (Tikhonov regularization)
  for (let i = 0; i < m; i++) {
    JJt[i][i] += damping * damping
  }

  // Invert JJt
  const JJtInv = invertMatrix(JJt)

  // Calculate J^T * (JJt)^-1
  const result = Array(n)
    .fill(0)
    .map(() => Array(m).fill(0))

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < m; k++) {
        result[i][j] += J[k][i] * JJtInv[k][j]
      }
    }
  }

  return result
}

// Matrix inversion helper (for small matrices)
function invertMatrix(matrix: number[][]) {
  const n = matrix.length

  // Special cases for small matrices (faster)
  if (n === 1) {
    return [[1 / matrix[0][0]]]
  }

  if (n === 2) {
    const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]
    if (Math.abs(det) < 1e-10) {
      // Add regularization for near-singular matrices
      const reg = 1e-6
      return [
        [(matrix[1][1] + reg) / (det + reg), -matrix[0][1] / (det + reg)],
        [-matrix[1][0] / (det + reg), (matrix[0][0] + reg) / (det + reg)],
      ]
    }
    return [
      [matrix[1][1] / det, -matrix[0][1] / det],
      [-matrix[1][0] / det, matrix[0][0] / det],
    ]
  }

  if (n === 3) {
    const det =
      matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
      matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
      matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])

    if (Math.abs(det) < 1e-10) {
      // Add regularization for near-singular matrices
      const reg = 1e-6
      const invDet = 1 / (det + reg)

      return [
        [
          (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1] + reg) * invDet,
          (matrix[0][2] * matrix[2][1] - matrix[0][1] * matrix[2][2]) * invDet,
          (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]) * invDet,
        ],
        [
          (matrix[1][2] * matrix[2][0] - matrix[1][0] * matrix[2][2]) * invDet,
          (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0] + reg) * invDet,
          (matrix[0][2] * matrix[1][0] - matrix[0][0] * matrix[1][2]) * invDet,
        ],
        [
          (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]) * invDet,
          (matrix[0][1] * matrix[2][0] - matrix[0][0] * matrix[2][1]) * invDet,
          (matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0] + reg) * invDet,
        ],
      ]
    }

    const invDet = 1 / det

    return [
      [
        (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) * invDet,
        (matrix[0][2] * matrix[2][1] - matrix[0][1] * matrix[2][2]) * invDet,
        (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]) * invDet,
      ],
      [
        (matrix[1][2] * matrix[2][0] - matrix[1][0] * matrix[2][2]) * invDet,
        (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]) * invDet,
        (matrix[0][2] * matrix[1][0] - matrix[0][0] * matrix[1][2]) * invDet,
      ],
      [
        (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]) * invDet,
        (matrix[0][1] * matrix[2][0] - matrix[0][0] * matrix[2][1]) * invDet,
        (matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]) * invDet,
      ],
    ]
  }

  // For larger matrices, use Gaussian elimination with pivoting
  // Create augmented matrix [A|I]
  const augmented = []
  for (let i = 0; i < n; i++) {
    augmented[i] = [...matrix[i]]
    for (let j = 0; j < n; j++) {
      augmented[i].push(i === j ? 1 : 0)
    }
  }

  // Gaussian elimination with partial pivoting
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i
    let maxVal = Math.abs(augmented[i][i])

    for (let j = i + 1; j < n; j++) {
      const absVal = Math.abs(augmented[j][i])
      if (absVal > maxVal) {
        maxVal = absVal
        maxRow = j
      }
    }

    // Swap rows if needed
    if (maxRow !== i) {
      ;[augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]
    }

    // Check for singular matrix
    if (Math.abs(augmented[i][i]) < 1e-10) {
      // Add regularization for numerical stability
      augmented[i][i] += 1e-6
    }

    // Scale row i
    const pivot = augmented[i][i]
    for (let j = i; j < 2 * n; j++) {
      augmented[i][j] /= pivot
    }

    // Eliminate other rows
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        const factor = augmented[j][i]
        for (let k = i; k < 2 * n; k++) {
          augmented[j][k] -= factor * augmented[i][k]
        }
      }
    }
  }

  // Extract inverse matrix from augmented matrix
  const inverse = []
  for (let i = 0; i < n; i++) {
    inverse[i] = augmented[i].slice(n, 2 * n)
  }

  return inverse
}

// Calculate Jacobian matrix
function calculateJacobian(q: number[], DH_params: number[][], delta = 1e-6) {
  const dof = q.length
  const [p0, R0] = forwardKinematics(q, DH_params)

  // Initialize Jacobian matrices
  const Jp = Array(3)
    .fill(0)
    .map(() => Array(dof).fill(0))
  const Jr = Array(3)
    .fill(0)
    .map(() => Array(dof).fill(0))

  for (let i = 0; i < dof; i++) {
    // Perturb joint angle
    const qd = [...q]
    qd[i] += delta

    // Calculate perturbed position and orientation
    const [pd, Rd] = forwardKinematics(qd, DH_params)

    // Position Jacobian
    for (let j = 0; j < 3; j++) {
      Jp[j][i] = (pd[j] - p0[j]) / delta
    }

    // Orientation Jacobian (using angle-axis representation)
    const R_diff = multiplyMatrices(Rd, transposeMatrix(R0))
    const trace = R_diff[0][0] + R_diff[1][1] + R_diff[2][2]
    const angle = Math.acos(Math.max(-1, Math.min(1, (trace - 1) / 2)))

    if (Math.abs(angle) > 1e-10) {
      const axis = [
        (R_diff[2][1] - R_diff[1][2]) / (2 * Math.sin(angle)),
        (R_diff[0][2] - R_diff[2][0]) / (2 * Math.sin(angle)),
        (R_diff[1][0] - R_diff[0][1]) / (2 * Math.sin(angle)),
      ]

      for (let j = 0; j < 3; j++) {
        Jr[j][i] = (axis[j] * angle) / delta
      }
    }
  }

  // Combine position and orientation Jacobians
  const J = [...Jp, ...Jr]
  return J
}

// Matrix transpose helper
function transposeMatrix(matrix: number[][]) {
  const rows = matrix.length
  const cols = matrix[0].length
  const result = Array(cols)
    .fill(0)
    .map(() => Array(rows).fill(0))

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = matrix[i][j]
    }
  }

  return result
}

// Check if position is within workspace
function isWithinWorkspace(pos: number[], dof: number) {
  const [x, y, z] = pos
  const workspace = workspace_dict[dof as keyof typeof workspace_dict]

  // Verificar que workspace existe
  if (!workspace) return false

  const { x_min, x_max, y_min, y_max, z_min, z_max } = workspace

  return x >= x_min && x <= x_max && y >= y_min && y <= y_max && z >= z_min && z <= z_max
}

// Inverse kinematics function
export function inverseKinematics(
  targetPos: number[],
  targetRot: number[][],
  initialGuess: number[] | null = null,
  maxIter = 1000,
  tol = 1e-4,
  lam = 0.05,
  w = 0.5,
  dof = DOF,
  DH_params = DH_template.slice(0, dof),
) {
  // Verificar que targetPos y targetRot son válidos
  if (!targetPos || targetPos.length !== 3 || !targetRot || targetRot.length !== 3) {
    console.error("targetPos o targetRot no son válidos:", { targetPos, targetRot })
    return { q: null, success: false }
  }

  // Verificar que DH_params es válido
  if (!DH_params || DH_params.length === 0) {
    console.error("DH_params no es válido:", DH_params)
    return { q: null, success: false }
  }

  // Check if target is within workspace
  if (!isWithinWorkspace(targetPos, dof)) {
    console.warn("Posición objetivo fuera del espacio de trabajo:", targetPos)
    return { q: null, success: false }
  }

  // Starting point
  const q = initialGuess && initialGuess.length >= dof ? initialGuess.slice(0, dof) : Array(dof).fill(0)

  let bestQ = [...q]
  let bestErr = Number.POSITIVE_INFINITY

  try {
    for (let iter = 0; iter < maxIter; iter++) {
      // Forward kinematics
      const [pos, R] = forwardKinematics(q, DH_params)

      // Position error
      const e_pos = [targetPos[0] - pos[0], targetPos[1] - pos[1], targetPos[2] - pos[2]]

      // Orientation error (angle-axis representation)
      const R_diff = multiplyMatrices(targetRot, transposeMatrix(R))
      const trace = R_diff[0][0] + R_diff[1][1] + R_diff[2][2]
      const angle = Math.acos(Math.max(-1, Math.min(1, (trace - 1) / 2)))

      let e_rot = [0, 0, 0]
      if (Math.abs(angle) > 1e-10) {
        const axis = [
          (R_diff[2][1] - R_diff[1][2]) / (2 * Math.sin(angle)),
          (R_diff[0][2] - R_diff[2][0]) / (2 * Math.sin(angle)),
          (R_diff[1][0] - R_diff[0][1]) / (2 * Math.sin(angle)),
        ]

        e_rot = axis.map((a) => a * angle)
      }

      // Combined error (with weight w for rotation)
      const error = [...e_pos, ...e_rot.map((e) => e * w)]

      // Error norm
      const errNorm = Math.sqrt(error.reduce((sum, e) => sum + e * e, 0))

      // Save best solution so far
      if (errNorm < bestErr) {
        bestErr = errNorm
        bestQ = [...q]
      }

      // Check convergence
      if (errNorm < tol) {
        return { q: bestQ, success: true }
      }

      // Calculate Jacobian
      const J_full = calculateJacobian(q, DH_params)

      // Calculate update step
      const J_pinv = dampedPseudoinverse(J_full, lam)
      const dq = Array(q.length).fill(0)

      for (let i = 0; i < q.length; i++) {
        for (let j = 0; j < error.length; j++) {
          dq[i] += J_pinv[i][j] * error[j]
        }
      }

      // Update joint angles
      for (let i = 0; i < q.length; i++) {
        q[i] += dq[i]
      }
    }
  } catch (error) {
    console.error("Error en inverseKinematics:", error)
    return { q: null, success: false }
  }

  // If we didn't converge, return the best approximation
  return { q: bestQ, success: bestErr < 0.1 }
}
