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

    console.log('🔄 Updating PowerUpManager'); // ✅ Debug

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

    console.log(`🔧 Creating power-up of type: ${type}`); // ✅ Debug

    // ✅ Créer un mesh spécifique selon le type de power-up
    let mesh: BABYLON.Mesh;
    
    switch (type) {
      case PowerUpType.SPEED_BOOST:
        mesh = this.createSpeedBoostMesh(id);
        console.log('⚡ Created speed boost mesh');
        break;
      case PowerUpType.PADDLE_SIZE:
        mesh = this.createPaddleSizeMesh(id);
        console.log('📏 Created paddle size mesh');
        break;
      case PowerUpType.BALL_SLOW:
        mesh = this.createBallSlowMesh(id);
        console.log('🕒 Created ball slow mesh');
        break;
      case PowerUpType.REVERSE_CONTROLS:
        mesh = this.createReverseControlsMesh(id);
        console.log('🔄 Created reverse controls mesh');
        break;
      case PowerUpType.FREEZE_OPPONENT:
        mesh = this.createFreezeMesh(id);
        console.log('❄️ Created freeze mesh');
        break;
      default:
        mesh = this.createDefaultMesh(id, config.color);
        console.log('⚪ Created default mesh for', type);
    }
    
    mesh.position = new BABYLON.Vector3(position.x, position.y, position.z);
    
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

  // ✅ Power-up Vitesse : Triple flèche simple
  private createSpeedBoostMesh(id: string): BABYLON.Mesh {
    const parent = new BABYLON.Mesh(`speed_boost_${id}`, this.scene);
    
    // Créer 3 cônes simples alignés comme des flèches
    for (let i = 0; i < 3; i++) {
      const arrow = BABYLON.MeshBuilder.CreateCylinder(
        `speed_arrow_${id}_${i}`,
        {
          height: 0.4,
          diameterTop: 0,
          diameterBottom: 0.2,
          tessellation: 8
        },
        this.scene
      );
      
      // Positionner les flèches en ligne
      arrow.position.x = (i - 1) * 0.15;
      arrow.rotation.z = Math.PI / 2; // Pointer vers la droite
      arrow.parent = parent;
      
      // Matériau vert simple
      const material = new BABYLON.StandardMaterial(`speed_mat_${id}_${i}`, this.scene);
      material.diffuseColor = new BABYLON.Color3(0, 1, 0);
      material.emissiveColor = new BABYLON.Color3(0, 0.5, 0);
      arrow.material = material;
    }
    
    return parent;
  }

  // ✅ Power-up Taille de Palette : Paddle géant simple
  private createPaddleSizeMesh(id: string): BABYLON.Mesh {
    const paddle = BABYLON.MeshBuilder.CreateBox(
      `paddle_size_${id}`,
      {
        width: 0.3,
        height: 0.8,
        depth: 0.2
      },
      this.scene
    );
    
    // Matériau bleu brillant
    const material = new BABYLON.StandardMaterial(`paddle_mat_${id}`, this.scene);
    material.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
    material.emissiveColor = new BABYLON.Color3(0, 0.2, 0.5);
    material.specularColor = new BABYLON.Color3(0.5, 0.8, 1);
    paddle.material = material;
    
    return paddle;
  }

  // ✅ Power-up Ralentissement : Horloge simple
  private createBallSlowMesh(id: string): BABYLON.Mesh {
    const parent = new BABYLON.Mesh(`ball_slow_${id}`, this.scene);
    
    // Base circulaire (cadran)
    const clock = BABYLON.MeshBuilder.CreateCylinder(
      `clock_${id}`,
      {
        height: 0.1,
        diameter: 0.5,
        tessellation: 16
      },
      this.scene
    );
    clock.parent = parent;
    
    // Aiguille des heures (courte)
    const hourHand = BABYLON.MeshBuilder.CreateBox(
      `hour_hand_${id}`,
      { width: 0.04, height: 0.15, depth: 0.02 },
      this.scene
    );
    hourHand.position.y = 0.075;
    hourHand.parent = parent;
    
    // Aiguille des minutes (longue)
    const minuteHand = BABYLON.MeshBuilder.CreateBox(
      `minute_hand_${id}`,
      { width: 0.03, height: 0.2, depth: 0.02 },
      this.scene
    );
    minuteHand.position.y = 0.1;
    minuteHand.rotation.z = Math.PI / 3; // Angle différent
    minuteHand.parent = parent;
    
    // Matériau jaune uniforme
    const material = new BABYLON.StandardMaterial(`slow_mat_${id}`, this.scene);
    material.diffuseColor = new BABYLON.Color3(1, 1, 0);
    material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);
    
    clock.material = material;
    hourHand.material = material;
    minuteHand.material = material;
    
    return parent;
  }

  // ✅ Power-up Contrôles Inversés : Flèches circulaires
  private createReverseControlsMesh(id: string): BABYLON.Mesh {
    const parent = new BABYLON.Mesh(`reverse_${id}`, this.scene);
    
    // Anneau central
    const ring = BABYLON.MeshBuilder.CreateTorus(
      `reverse_ring_${id}`,
      {
        diameter: 0.4,
        thickness: 0.06,
        tessellation: 16
      },
      this.scene
    );
    ring.parent = parent;
    
    // 4 flèches autour du cercle
    for (let i = 0; i < 4; i++) {
      const arrow = BABYLON.MeshBuilder.CreateCylinder(
        `reverse_arrow_${id}_${i}`,
        {
          height: 0.1,
          diameterTop: 0,
          diameterBottom: 0.08,
          tessellation: 6
        },
        this.scene
      );
      
      const angle = (i * Math.PI) / 2;
      arrow.position.x = Math.cos(angle) * 0.25;
      arrow.position.z = Math.sin(angle) * 0.25;
      arrow.rotation.y = angle + Math.PI / 2; // Orientation circulaire
      arrow.parent = parent;
      
      // Matériau magenta
      const arrowMaterial = new BABYLON.StandardMaterial(`reverse_arrow_mat_${id}_${i}`, this.scene);
      arrowMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1);
      arrowMaterial.emissiveColor = new BABYLON.Color3(0.5, 0, 0.5);
      arrow.material = arrowMaterial;
    }
    
    // Matériau de l'anneau
    const ringMaterial = new BABYLON.StandardMaterial(`reverse_ring_mat_${id}`, this.scene);
    ringMaterial.diffuseColor = new BABYLON.Color3(0.8, 0, 0.8);
    ringMaterial.emissiveColor = new BABYLON.Color3(0.3, 0, 0.3);
    ring.material = ringMaterial;
    
    return parent;
  }

  // ✅ Power-up Gel : Cristal de glace simple
  private createFreezeMesh(id: string): BABYLON.Mesh {
    const parent = new BABYLON.Mesh(`freeze_${id}`, this.scene);
    
    // Cristal principal (diamant)
    const crystal = BABYLON.MeshBuilder.CreatePolyhedron(
      `freeze_crystal_${id}`,
      {
        type: 1, // Octaèdre (forme de diamant)
        size: 0.2
      },
      this.scene
    );
    crystal.parent = parent;
    
    // 4 petits cristaux autour
    for (let i = 0; i < 4; i++) {
      const smallCrystal = BABYLON.MeshBuilder.CreatePolyhedron(
        `freeze_small_${id}_${i}`,
        {
          type: 1,
          size: 0.08
        },
        this.scene
      );
      
      const angle = (i * Math.PI) / 2;
      smallCrystal.position.x = Math.cos(angle) * 0.2;
      smallCrystal.position.z = Math.sin(angle) * 0.2;
      smallCrystal.position.y = Math.random() * 0.1 - 0.05;
      smallCrystal.parent = parent;
      
      // Matériau cristallin
      const smallMaterial = new BABYLON.StandardMaterial(`freeze_small_mat_${id}_${i}`, this.scene);
      smallMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.95, 1);
      smallMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
      smallMaterial.emissiveColor = new BABYLON.Color3(0, 0.1, 0.2);
      smallCrystal.material = smallMaterial;
    }
    
    // Matériau du cristal principal
    const material = new BABYLON.StandardMaterial(`freeze_mat_${id}`, this.scene);
    material.diffuseColor = new BABYLON.Color3(0.5, 0.9, 1);
    material.specularColor = new BABYLON.Color3(1, 1, 1);
    material.emissiveColor = new BABYLON.Color3(0, 0.3, 0.4);
    material.alpha = 0.9; // Légère transparence
    crystal.material = material;
    
    return parent;
  }

  // ✅ Mesh par défaut : Sphère colorée simple
  private createDefaultMesh(id: string, color: BABYLON.Color3): BABYLON.Mesh {
    const mesh = BABYLON.MeshBuilder.CreateSphere(
      `powerup_${id}`,
      { diameter: 0.4 },
      this.scene
    );
    
    const material = new BABYLON.StandardMaterial(`powerup_mat_${id}`, this.scene);
    material.diffuseColor = color;
    material.emissiveColor = color.scale(0.4);
    material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    mesh.material = material;
    
    return mesh;
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

    // ✅ Animation de pulsation pour attirer l'attention
    const scaleAnimation = new BABYLON.Animation(
      'powerUpScale',
      'scaling',
      20,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const scaleKeys = [
      { frame: 0, value: new BABYLON.Vector3(1, 1, 1) },
      { frame: 20, value: new BABYLON.Vector3(1.1, 1.1, 1.1) },
      { frame: 40, value: new BABYLON.Vector3(1, 1, 1) }
    ];

    scaleAnimation.setKeys(scaleKeys);

    // Appliquer les animations
    mesh.animations = [rotationAnimation, floatAnimation, scaleAnimation];
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