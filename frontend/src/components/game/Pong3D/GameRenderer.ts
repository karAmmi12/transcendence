import * as BABYLON from '@babylonjs/core';
import type { GameSettings } from './Pong3D.js';

export interface GameObjects {
  field: BABYLON.Mesh;
  player1Paddle: BABYLON.Mesh;
  player2Paddle: BABYLON.Mesh;
  ball: BABYLON.Mesh;
}

export interface ObjectPositions {
  player1Paddle: { x: number; z: number };
  player2Paddle: { x: number; z: number };
  ball: { x: number; y: number; z: number };
}

export class GameRenderer {
  private scene: BABYLON.Scene;
  private camera: BABYLON.ArcRotateCamera;
  private gameObjects: GameObjects;
  private settings: GameSettings;

  constructor(scene: BABYLON.Scene, settings: GameSettings) {
    this.scene = scene;
    this.settings = settings;
    
    this.setupCamera();
    this.setupLighting();
    this.createGameObjects();
  }

  private setupCamera(): void {
    this.camera = new BABYLON.ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 3,
      15,
      BABYLON.Vector3.Zero(),
      this.scene
    );
    
    this.adjustCameraForScreen();
  }

  private setupLighting(): void {
    // Lumière ambiante
    const hemiLight = new BABYLON.HemisphericLight(
      'hemiLight',
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = 0.6;
    
    // Lumière directionnelle
    const dirLight = new BABYLON.DirectionalLight(
      'dirLight',
      new BABYLON.Vector3(-1, -1, -1),
      this.scene
    );
    dirLight.intensity = 0.8;
    dirLight.position = new BABYLON.Vector3(5, 10, 5);
  }

  private createGameObjects(): void {
    this.gameObjects = {
      field: this.createField(),
      player1Paddle: this.createPaddle('player1', -4.5),
      player2Paddle: this.createPaddle('player2', 4.5),
      ball: this.createBall()
    };
  }

  private createField(): BABYLON.Mesh {
    // Terrain principal
    const field = BABYLON.MeshBuilder.CreateGround(
      'field',
      { width: 10, height: 6 },
      this.scene
    );
    
    const fieldMaterial = new BABYLON.StandardMaterial('fieldMaterial', this.scene);
    fieldMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.3, 0.1);
    fieldMaterial.specularColor = new BABYLON.Color3(0.2, 0.5, 0.2);
    field.material = fieldMaterial;
    
    // Ligne centrale
    const centerLine = BABYLON.MeshBuilder.CreateBox(
      'centerLine',
      { width: 0.1, height: 0.02, depth: 6 },
      this.scene
    );
    centerLine.position = new BABYLON.Vector3(0, 0.01, 0);
    
    const centerLineMaterial = new BABYLON.StandardMaterial('centerLineMaterial', this.scene);
    centerLineMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    centerLine.material = centerLineMaterial;
    
    // Bordures
    this.createFieldBorders();
    
    return field;
  }

  private createFieldBorders(): void {
    const borderMaterial = new BABYLON.StandardMaterial('borderMaterial', this.scene);
    borderMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1);
    
    // Bordures haut et bas
    const topBorder = BABYLON.MeshBuilder.CreateBox(
      'topBorder',
      { width: 10, height: 0.2, depth: 0.2 },
      this.scene
    );
    topBorder.position = new BABYLON.Vector3(0, 0.1, 3);
    topBorder.material = borderMaterial;
    
    const bottomBorder = BABYLON.MeshBuilder.CreateBox(
      'bottomBorder',
      { width: 10, height: 0.2, depth: 0.2 },
      this.scene
    );
    bottomBorder.position = new BABYLON.Vector3(0, 0.1, -3);
    bottomBorder.material = borderMaterial;
  }

  private createPaddle(player: 'player1' | 'player2', xPosition: number): BABYLON.Mesh {
    const paddle = BABYLON.MeshBuilder.CreateBox(
      `${player}Paddle`,
      { width: 0.2, height: 0.5, depth: 1.5 },
      this.scene
    );
    paddle.position = new BABYLON.Vector3(xPosition, 0.25, 0);
    
    const material = new BABYLON.StandardMaterial(`${player}Material`, this.scene);
    
    if (player === 'player1') {
      material.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1); // Bleu
    } else {
      material.diffuseColor = new BABYLON.Color3(1, 0.3, 0.2); // Rouge
    }
    
    paddle.material = material;
    return paddle;
  }

  private createBall(): BABYLON.Mesh {
    const ball = BABYLON.MeshBuilder.CreateSphere(
      'ball',
      { diameter: 0.3 },
      this.scene
    );
    ball.position = new BABYLON.Vector3(0, 0.15, 0);
    
    const ballMaterial = new BABYLON.StandardMaterial('ballMaterial', this.scene);
    ballMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0.2); // Jaune
    ballMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    ball.material = ballMaterial;
    
    return ball;
  }

  public updatePositions(positions: ObjectPositions): void {
    // Mettre à jour les positions des objets
    this.gameObjects.player1Paddle.position.z = positions.player1Paddle.z;
    this.gameObjects.player2Paddle.position.z = positions.player2Paddle.z;
    
    this.gameObjects.ball.position.x = positions.ball.x;
    this.gameObjects.ball.position.y = positions.ball.y;
    this.gameObjects.ball.position.z = positions.ball.z;
  }

  public adjustCameraForScreen(): void {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
    
    if (isMobile) {
      this.camera.radius = 18;
      this.camera.beta = Math.PI / 2.5;
    } else if (isTablet) {
      this.camera.radius = 16;
      this.camera.beta = Math.PI / 2.8;
    } else {
      this.camera.radius = 15;
      this.camera.beta = Math.PI / 3;
    }
  }

  public getGameObjects(): GameObjects {
    return this.gameObjects;
  }

  public destroy(): void {
    // Nettoyer les objets si nécessaire
  }
}