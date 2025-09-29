import * as BABYLON from '@babylonjs/core';

export enum PowerUpType {
  PADDLE_SIZE = 'paddle_size',
  REVERSE_CONTROLS = 'reverse_controls',
  FREEZE_OPPONENT = 'freeze_opponent'
}

export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: { x: number; y: number; z: number };
  mesh: BABYLON.Mesh;
  duration: number;
  isActive: boolean;
  createdAt: number;
  expiresAt: number;
  spawned?: number;
  lifespan?: number;
}

export interface ActiveEffect {
  id: string;
  type: PowerUpType;
  targetPlayer: 'player1' | 'player2';
  startTime: number;
  duration: number;
  originalValue?: any;
  effects?: PowerUpEffects;
}

export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  description: string;
  color: BABYLON.Color3;
  spawnWeight: number;
  duration: number;
  lifespan: number;
  effects: PowerUpEffects;
}

export interface PowerUpEffects {
  ballSpeedMultiplier?: number;
  paddleSpeedMultiplier?: number;
  paddleSizeMultiplier?: number;
  reverseControls?: boolean;
  freezePlayer?: boolean;
  invisibleBall?: boolean;
  multiBall?: number;
}