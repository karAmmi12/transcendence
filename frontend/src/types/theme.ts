import * as BABYLON from '@babylonjs/core';

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  colors: {
    field: BABYLON.Color3;
    ball: BABYLON.Color3;
    player1Paddle: BABYLON.Color3;
    player2Paddle: BABYLON.Color3;
    borders: BABYLON.Color3;
    centerLine: BABYLON.Color3;
    background: BABYLON.Color4;
  };
  materials: {
    field: MaterialConfig;
    ball: MaterialConfig;
    paddles: MaterialConfig;
    borders: MaterialConfig;
  };
  lighting: {
    ambient: number;
    directional: number;
    shadowsEnabled: boolean;
  };
  effects: {
    ballTrail: boolean;
    particles: boolean;
    glow: boolean;
    ballStretch?: boolean;
    fieldAnimation?: boolean;
    steamEffect?: boolean;
    matrixRain?: boolean;
    glitch?: boolean;
    screenShake?: boolean;
  };
  textures?: {
    field?: string;
    ball?: string;
    paddles?: string;
  };
}

export interface MaterialConfig {
  type: 'standard' | 'pbr' | 'emissive';
  properties: {
    diffuseColor?: BABYLON.Color3;
    emissiveColor?: BABYLON.Color3;
    specularColor?: BABYLON.Color3;
    metallic?: number;
    roughness?: number;
    transparency?: number;
  };
}