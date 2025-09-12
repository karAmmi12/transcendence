import * as BABYLON from '@babylonjs/core';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: { x: number; y: number; z: number };
  mesh: BABYLON.Mesh;
  duration: number; // durée d'effet en secondes
  isActive: boolean;
  createdAt: number;
  expiresAt: number; // quand le power-up disparaît du terrain
}

export enum PowerUpType {
  PADDLE_SIZE = 'paddle_size',
  REVERSE_CONTROLS = 'reverse_controls',
  FREEZE_OPPONENT = 'freeze_opponent'
}

export interface ActiveEffect {
  id: string;
  type: PowerUpType;
  targetPlayer: 'player1' | 'player2';
  startTime: number;
  duration: number;
  originalValue?: any; // pour restaurer l'état original
}

export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  description: string;
  color: BABYLON.Color3;
  spawnWeight: number; // probabilité d'apparition
  duration: number; // durée d'effet
  lifespan: number; // temps sur le terrain avant disparition
  effects: PowerUpEffects;
}

export interface PowerUpEffects {
  ballSpeedMultiplier?: number;
  paddleSpeedMultiplier?: number;
  paddleSizeMultiplier?: number;
  reverseControls?: boolean;
  freezePlayer?: boolean;
  invisibleBall?: boolean;
  multiBall?: number; // nombre de balles supplémentaires
}