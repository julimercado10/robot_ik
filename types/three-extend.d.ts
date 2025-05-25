declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera } from 'three';
  export class OrbitControls {
    constructor(object: Camera, domElement?: HTMLElement);
    // Puedes agregar aquí más métodos/properties si necesitas autocompletado
    // Ejemplo:
    update(): void;
    dispose(): void;
    enableDamping: boolean;
    dampingFactor: number;
    rotateSpeed: number;
    zoomSpeed: number;
    panSpeed: number;
    // ...
  }
  export default OrbitControls;
}