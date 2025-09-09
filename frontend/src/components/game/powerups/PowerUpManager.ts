import * as BABYLON from '@babylonjs/core';
import { PowerUp, PowerUpType, PowerUpConfig, ActiveEffect, PowerUpEffects } from '../../../types/powerups.js';

export class PowerUpManager {
  private scene: BABYLON.Scene;
  private powerUps: Map<string, PowerUp> = new Map();
  private activeEffects: Map<string, ActiveEffect> = new Map();
  private spawnTimer: number = 0;
  private spawnInterval: number = 10; // secondes entre les spawns
  private maxPowerUps: number = 2;
  private enabled: boolean = false;

  private configs: Map<PowerUpType, PowerUpConfig> = new Map([
    [PowerUpType.SPEED_BOOST, {
      type: PowerUpType.SPEED_BOOST,
      name: 'Vitesse',
      description: 'Augmente la vitesse de votre paddle',
      color: new BABYLON.Color3(0, 1, 0), // Vert
      spawnWeight: 20,
      duration: 8,
      lifespan: 15,
      effects: { paddleSpeedMultiplier: 1.5 }
    }],
    [PowerUpType.PADDLE_SIZE, {
      type: PowerUpType.PADDLE_SIZE,
      name: 'Grande Palette',
      description: 'Augmente la taille de votre paddle',
      color: new BABYLON.Color3(0, 0, 1), // Bleu
      spawnWeight: 15,
      duration: 10,
      lifespan: 15,
      effects: { paddleSizeMultiplier: 1.4 }
    }],
    [PowerUpType.BALL_SLOW, {
      type: PowerUpType.BALL_SLOW,
      name: 'Ralentir',
      description: 'Ralentit la balle',
      color: new BABYLON.Color3(1, 1, 0), // Jaune
      spawnWeight: 18,
      duration: 6,
      lifespan: 12,
      effects: { ballSpeedMultiplier: 0.6 }
    }],
    [PowerUpType.REVERSE_CONTROLS, {
      type: PowerUpType.REVERSE_CONTROLS,
      name: 'Contrôles Inversés',
      description: 'Inverse les contrôles de l\'adversaire',
      color: new BABYLON.Color3(1, 0, 1), // Magenta
      spawnWeight: 12,
      duration: 7,
      lifespan: 10,
      effects: { reverseControls: true }
    }],
    [PowerUpType.FREEZE_OPPONENT, {
      type: PowerUpType.FREEZE_OPPONENT,
      name: 'Gel',
      description: 'Gèle l\'adversaire temporairement',
      color: new BABYLON.Color3(0, 1, 1), // Cyan
      spawnWeight: 8,
      duration: 3,
      lifespan: 8,
      effects: { freezePlayer: true }
    }]
  ]);

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }

  public enable(): void {
    this.enabled = true;
    console.log('🔋 Power-ups enabled');
  }

  public disable(): void {
    this.enabled = false;
    this.clearAllPowerUps();
    this.clearAllEffects();
    console.log('🚫 Power-ups disabled');
  }

  public update(deltaTime: number): void {
    if (!this.enabled) return;

    this.spawnTimer += deltaTime;
    
    // Spawner de nouveaux power-ups
    if (this.spawnTimer >= this.spawnInterval && this.powerUps.size < this.maxPowerUps) {
      this.spawnRandomPowerUp();
      this.spawnTimer = 0;
    }

    // Mettre à jour les power-ups existants
    this.updatePowerUps();
    
    // Mettre à jour les effets actifs
    this.updateActiveEffects();
  }

  private spawnRandomPowerUp(): void {
    const types = Array.from(this.configs.keys());
    const weights = types.map(type => this.configs.get(type)!.spawnWeight);
    const selectedType = this.weightedRandomSelect(types, weights);
    
    const position = this.getRandomSpawnPosition();
    this.createPowerUp(selectedType, position);
  }

  private weightedRandomSelect<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }

  private getRandomSpawnPosition(): { x: number; y: number; z: number } {
    return {
      x: (Math.random() - 0.5) * 6, // Entre -3 et 3
      y: 0.3,
      z: (Math.random() - 0.5) * 4  // Entre -2 et 2
    };
  }

  private createPowerUp(type: PowerUpType, position: { x: number; y: number; z: number }): void {
    const config = this.configs.get(type)!;
    const id = `powerup_${Date.now()}_${Math.random()}`;

    // Créer le mesh visuel
    const mesh = BABYLON.MeshBuilder.CreateSphere(
      `powerup_${id}`,
      { diameter: 0.3 },
      this.scene
    );
    
    mesh.position = new BABYLON.Vector3(position.x, position.y, position.z);
    
    // Matériau avec couleur du power-up
    const material = new BABYLON.StandardMaterial(`powerup_mat_${id}`, this.scene);
    material.diffuseColor = config.color;
    material.emissiveColor = config.color.scale(0.3);
    mesh.material = material;

    // Animation de rotation et flottement
    this.animatePowerUp(mesh);

    const powerUp: PowerUp = {
      id,
      type,
      position,
      mesh,
      duration: config.duration,
      isActive: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + (config.lifespan * 1000)
    };

    this.powerUps.set(id, powerUp);
    console.log(`🔋 Spawned power-up: ${config.name} at`, position);
  }

  private animatePowerUp(mesh: BABYLON.Mesh): void {
    // Animation de rotation
    const rotationAnimation = new BABYLON.Animation(
      'powerUpRotation',
      'rotation.y',
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const rotationKeys = [
      { frame: 0, value: 0 },
      { frame: 60, value: Math.PI * 2 }
    ];

    rotationAnimation.setKeys(rotationKeys);

    // Animation de flottement
    const floatAnimation = new BABYLON.Animation(
      'powerUpFloat',
      'position.y',
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const floatKeys = [
      { frame: 0, value: mesh.position.y },
      { frame: 30, value: mesh.position.y + 0.1 },
      { frame: 60, value: mesh.position.y }
    ];

    floatAnimation.setKeys(floatKeys);

    // Appliquer les animations
    mesh.animations = [rotationAnimation, floatAnimation];
    this.scene.beginAnimation(mesh, 0, 60, true);
  }

  public checkCollision(ballPosition: { x: number; y: number; z: number }): PowerUp | null {
    for (const powerUp of this.powerUps.values()) {
        if (powerUp.isActive) continue;

        const distance = Math.sqrt(
            Math.pow(ballPosition.x - powerUp.position.x, 2) +
            Math.pow(ballPosition.y - powerUp.position.y, 2) +
            Math.pow(ballPosition.z - powerUp.position.z, 2)
        );

      
        // ✅ Augmenter le rayon de collision pour faciliter la détection
        if (distance < 0.4) { // Était 0.25, maintenant 0.4
        console.log(`🎯 Collision detected! Distance: ${distance.toFixed(3)}, PowerUp: ${powerUp.type}`);
        return powerUp;
        }
    }

    return null;
  }

  public activatePowerUp(powerUpId: string, targetPlayer: 'player1' | 'player2'): void {
    const powerUp = this.powerUps.get(powerUpId);
    if (!powerUp || powerUp.isActive) return;

    const config = this.configs.get(powerUp.type)!;
    
    // Marquer comme actif et masquer
    powerUp.isActive = true;
    powerUp.mesh.setEnabled(false);

    // Créer l'effet actif
    const effectId = `effect_${Date.now()}_${Math.random()}`;
    const effect: ActiveEffect = {
      id: effectId,
      type: powerUp.type,
      targetPlayer,
      startTime: Date.now(),
      duration: config.duration * 1000
    };

    this.activeEffects.set(effectId, effect);

    // Supprimer le power-up après un délai
    setTimeout(() => {
      this.removePowerUp(powerUpId);
    }, 1000);

    console.log(`⚡ Activated power-up: ${config.name} for ${targetPlayer}`);
  }

  public getActiveEffects(): Map<string, ActiveEffect> {
    return new Map(this.activeEffects);
  }

  public hasEffect(player: 'player1' | 'player2', type: PowerUpType): boolean {
    for (const effect of this.activeEffects.values()) {
      if (effect.targetPlayer === player && effect.type === type) {
        return true;
      }
    }
    return false;
  }

  private updatePowerUps(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [id, powerUp] of this.powerUps.entries()) {
      if (now > powerUp.expiresAt && !powerUp.isActive) {
        toRemove.push(id);
      }
    }

    toRemove.forEach(id => this.removePowerUp(id));
  }

  private updateActiveEffects(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [id, effect] of this.activeEffects.entries()) {
      if (now > effect.startTime + effect.duration) {
        toRemove.push(id);
      }
    }

    toRemove.forEach(id => {
      const effect = this.activeEffects.get(id);
      if (effect) {
        console.log(`⏰ Effect expired: ${effect.type} for ${effect.targetPlayer}`);
        this.activeEffects.delete(id);
      }
    });
  }

  private removePowerUp(id: string): void {
    const powerUp = this.powerUps.get(id);
    if (powerUp) {
      powerUp.mesh.dispose();
      this.powerUps.delete(id);
    }
  }

  private clearAllPowerUps(): void {
    for (const powerUp of this.powerUps.values()) {
      powerUp.mesh.dispose();
    }
    this.powerUps.clear();
  }

  private clearAllEffects(): void {
    this.activeEffects.clear();
  }

  public dispose(): void {
    this.clearAllPowerUps();
    this.clearAllEffects();
  }
}