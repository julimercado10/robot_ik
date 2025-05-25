# 🤖 Visualización Cinemática del Brazo Robótico

Una aplicación web interactiva que visualiza un brazo robótico con grados de libertad (DOF) configurables de 2 a 7. Implementa la cinemática directa e inversa utilizando los parámetros Denavit-Hartenberg.

![Robot Kinematics Visualization](https://img.shields.io/badge/Status-Active-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-Latest-orange?logo=three.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?logo=tailwind-css)

## ✨ Características

### 🎯 Funcionalidades Principales
- **Cinemática Directa e Inversa**: Implementación completa de algoritmos de cinemática robótica
- **DOF Configurables**: Soporte para robots de 2 a 7 grados de libertad
- **Visualización 3D Interactiva**: Renderizado en tiempo real con Three.js
- **Parámetros Denavit-Hartenberg**: Configuración basada en estándares industriales
- **Interfaz Responsive**: Optimizada para desktop, tablet y móvil

### 🎮 Controles Interactivos
- **Posición del Efector Final**: Control de coordenadas X, Y, Z
- **Orientación**: Control de ángulos Roll, Pitch, Yaw
- **Tiempo Real**: Actualización instantánea de la visualización
- **Información de Estado**: Monitoreo del estado de la solución IK

### 📱 Diseño Responsive
- **Mobile-First**: Interfaz optimizada para dispositivos móviles
- **Controles Colapsables**: Panel de controles ocultable en móviles
- **Touch-Friendly**: Sliders y controles adaptados para pantallas táctiles
- **Información Superpuesta**: Paneles de estado integrados en la visualización

## 🛠️ Tecnologías Utilizadas

### Frontend Framework
- **[Next.js 15](https://nextjs.org/)** - Framework de React para aplicaciones web
- **[TypeScript](https://www.typescriptlang.org/)** - Tipado estático para JavaScript
- **[React 18](https://reactjs.org/)** - Biblioteca para interfaces de usuario

### Visualización 3D
- **[Three.js](https://threejs.org/)** - Biblioteca de gráficos 3D para web
- **[OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls)** - Controles de cámara interactivos

### UI/UX
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework de CSS utilitario
- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes de UI reutilizables
- **[Lucide React](https://lucide.dev/)** - Iconos SVG para React

### Matemáticas y Algoritmos
- **Matrices de Transformación**: Implementación nativa de álgebra lineal
- **Cinemática Inversa**: Algoritmo de Newton-Raphson con regularización
- **Jacobiano**: Cálculo numérico de derivadas parciales

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** 18.0 o superior
- **npm** o **yarn** como gestor de paquetes

### 1. Clonar el Repositorio
```bash
git clone https://github.com/julimercado10/robot_ik.git
cd my-app
```

### 2. Instalar Dependencias
```bash
npm install
# o
yarn install
```

### 3. Ejecutar en Modo Desarrollo
```bash
npm run dev
# o
yarn dev
```

### 4. Abrir en el Navegador
Navega a [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo

# Producción
npm run build        # Construye la aplicación para producción
npm run start        # Inicia el servidor de producción

# Calidad de Código
npm run lint         # Ejecuta ESLint
npm run type-check   # Verifica tipos de TypeScript
```

## 🏗️ Estructura del Proyecto

```
robot-kinematics-visualization/
├── app/
│   ├── layout.tsx           # Layout principal de la aplicación
│   ├── page.tsx            # Página principal con controles
│   └── globals.css         # Estilos globales
├── components/
│   ├── robot-visualization.tsx  # Componente de visualización 3D
│   ├── theme-provider.tsx      # Proveedor de temas
│   └── ui/                     # Componentes de UI (shadcn/ui)
├── lib/
│   ├── kinematics.ts          # Algoritmos de cinemática
│   └── utils.ts               # Utilidades generales
├── public/                    # Archivos estáticos
├── next.config.mjs           # Configuración de Next.js
├── tailwind.config.ts        # Configuración de Tailwind CSS
└── tsconfig.json            # Configuración de TypeScript
```

## 🎯 Uso de la Aplicación

### 1. Configuración del Robot
1. **Seleccionar DOF**: Elige entre 2 y 7 grados de libertad
2. **Ajustar Posición**: Usa los sliders para establecer la posición objetivo (X, Y, Z)
3. **Configurar Orientación**: Ajusta los ángulos de Roll, Pitch y Yaw

### 2. Visualización 3D
- **Rotación**: Click y arrastra para rotar la vista
- **Zoom**: Usa la rueda del mouse para acercar/alejar
- **Pan**: Click derecho y arrastra para desplazar la vista

### 3. Información en Tiempo Real
- **Estado de la Solución**: Verde si se encuentra solución, rojo si no
- **Tiempo de Cálculo**: Tiempo en segundos para resolver la cinemática inversa
- **Posición Objetivo**: Coordenadas actuales del punto objetivo

### 4. Uso en Móviles
- **Mostrar/Ocultar Controles**: Usa el botón en la parte superior
- **Gestos Táctiles**: Toca y arrastra para interactuar con la visualización 3D

## 🧮 Algoritmos Implementados

### Cinemática Directa
- **Parámetros DH**: Implementación estándar de Denavit-Hartenberg
- **Matrices de Transformación**: Cálculo de posición y orientación del efector final

### Cinemática Inversa
- **Método de Newton-Raphson**: Algoritmo iterativo para resolver la cinemática inversa
- **Jacobiano Numérico**: Cálculo de derivadas parciales por diferencias finitas
- **Regularización de Tikhonov**: Manejo de singularidades y matrices mal condicionadas

### Características Matemáticas
- **Espacios de Trabajo**: Definición automática según el número de DOF
- **Verificación de Límites**: Validación de posiciones alcanzables
- **Optimización**: Múltiples intentos con diferentes condiciones iniciales

## 🎨 Personalización

### Modificar Parámetros DH
Edita el archivo `lib/kinematics.ts` para cambiar los parámetros del robot:

```typescript
export const DH_template = [
  [theta_offset, d, a, alpha],  // Articulación 1
  [theta_offset, d, a, alpha],  // Articulación 2
  // ... más articulaciones
]
```

### Ajustar Espacios de Trabajo
Modifica los límites en `workspace_dict` para diferentes configuraciones:

```typescript
export const workspace_dict = {
  2: { x_min: -0.4, x_max: 0.4, y_min: -0.4, y_max: 0.4, z_min: 0.3, z_max: 0.8 },
  // ... más configuraciones
}
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. **Fork** el repositorio
2. **Crea** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre** un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- **Three.js Community** - Por la excelente biblioteca de gráficos 3D
- **Next.js Team** - Por el framework de desarrollo web
- **shadcn/ui** - Por los componentes de UI elegantes y funcionales
- **Tailwind CSS** - Por el sistema de diseño utilitario

## 📞 Contacto

**Julieth Mercado Long**

**Link del Proyecto**: [https://github.com/julimercado10/robot_ik](https://github.com/julimercado10/robot_ik)

---

⭐ **¡No olvides dar una estrella al proyecto si te resultó útil!** ⭐
```

Este README incluye:

## 🌟 Características Destacadas

1. **Badges Informativos**: Estado del proyecto y tecnologías utilizadas
2. **Emojis Descriptivos**: Hacen el README más visual y fácil de navegar
3. **Secciones Organizadas**: Información clara y estructurada
4. **Instrucciones Detalladas**: Paso a paso para instalación y uso
5. **Código Formateado**: Ejemplos de código con sintaxis highlighting
6. **Enlaces a Documentación**: Referencias a las tecnologías utilizadas
7. **Estructura Visual**: Árbol de directorios para entender la organización
8. **Guías de Contribución**: Instrucciones para colaboradores
9. **Información de Contacto**: Sección para comunicación
10. **Call-to-Action**: Invitación a dar estrella al proyecto

El README está diseñado para ser profesional, informativo y atractivo visualmente, proporcionando toda la información necesaria para que otros desarrolladores puedan entender, instalar y contribuir al proyecto.
