declare module 'troika-three-text' {
  import * as THREE from 'three';

  export class Text extends THREE.Mesh {
    text: string;
    fontSize: number;
    color: number | string;
    anchorX: 'left' | 'center' | 'right' | number;
    anchorY: 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom' | number;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    visible: boolean;
    sync(): void;
    dispose(): void;
  }
}
