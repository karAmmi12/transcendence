import * as BABYLON from '@babylonjs/core';
import { PowerUp, PowerUpType, PowerUpConfig, ActiveEffect } from '../../../types/powerups.js';
import { i18n } from '@services/i18nService.js';
import { Logger } from '@/utils/logger.js'; 

export class PowerUpManager
{
  // ==========================================
  // PROPRIÉTÉS PRIVÉES
  // ==========================================

  private scene: BABYLON.Scene;
  private powerUps: Map<string, PowerUp> = new Map();
  private activeEffects: Map<string, ActiveEffect> = new Map();
  private spawnTimer: number = 0;
  private spawnInterval: number = 10;
  private maxPowerUps: number = 2;
  private enabled: boolean = false;

  // ==========================================
  // CONFIGURATIONS DES POWER-UPS
  // ==========================================

  private configs: Map<PowerUpType, PowerUpConfig> = new Map([
    [PowerUpType.PADDLE_SIZE, {
      type: PowerUpType.PADDLE_SIZE,
      name: i18n.t('powerups.paddle_size'),
      description: i18n.t('powerups.paddle_size_description'),
      color: new BABYLON.Color3(0, 0, 1), // Bleu
      spawnWeight: 15,
      duration: 10,
      lifespan: 15,
      effects: { paddleSizeMultiplier: 1.7 }
    }],

    [PowerUpType.REVERSE_CONTROLS, {
      type: PowerUpType.REVERSE_CONTROLS,
      name: i18n.t('powerups.reverse_controls'),
      description: i18n.t('powerups.reverse_controls_description'),
      color: new BABYLON.Color3(1, 0, 1), // Magenta
      spawnWeight: 12,
      duration: 7,
      lifespan: 10,
      effects: { reverseControls: true }
    }],

    [PowerUpType.FREEZE_OPPONENT, {
      type: PowerUpType.FREEZE_OPPONENT,
      name: i18n.t('powerups.freeze_opponent'),
      description: i18n.t('powerups.freeze_opponent_description'),
      color: new BABYLON.Color3(0, 1, 1), // Cyan
      spawnWeight: 8,
      duration: 3,
      lifespan: 8,
      effects: { freezePlayer: true }
    }]
  ]);

  // ==========================================
  // CONSTRUCTEUR
  // ==========================================

  /**
   * Constructeur du gestionnaire de power-ups
   * @param scene Scène Babylon.js
   */
  constructor(scene: BABYLON.Scene)
  {
    this.scene = scene;
  }

  // ==========================================
  // MÉTHODES PUBLIQUES DE CONTRÔLE
  // ==========================================

  /**
   * Active les power-ups
   */
  public enable(): void
  {
    this.enabled = true;
    Logger.log('🔋 Power-ups enabled');
  }

  /**
   * Désactive les power-ups
   */
  public disable(): void
  {
    this.enabled = false;
    this.clearAllPowerUps();
    this.clearAllEffects();
    Logger.log('🚫 Power-ups disabled');
  }

  /**
   * Met à jour le gestionnaire de power-ups
   * @param deltaTime Temps écoulé depuis la dernière mise à jour
   */
  public update(deltaTime: number): void
  {
    if (!this.enabled) return;

    Logger.log('🔄 Updating PowerUpManager'); // ✅ Debug

    this.spawnTimer += deltaTime;

    // Spawner de nouveaux power-ups
    if (this.spawnTimer >= this.spawnInterval && this.powerUps.size < this.maxPowerUps)
    {
      this.spawnRandomPowerUp();
      this.spawnTimer = 0;
    }

    // Mettre à jour les power-ups existants
    this.updatePowerUps();

    // Mettre à jour les effets actifs
    this.updateActiveEffects();
  }

  // ==========================================
  // MÉTHODES PUBLIQUES DE GESTION DES POWER-UPS
  // ==========================================

  /**
   * Vérifie les collisions avec la balle
   * @param ballPosition Position de la balle
   * @returns Power-up en collision ou null
   */
  public checkCollision(ballPosition: { x: number; y: number; z: number }): PowerUp | null
  {
    for (const powerUp of this.powerUps.values())
    {
      if (powerUp.isActive) continue;

      const distance = Math.sqrt(
        Math.pow(ballPosition.x - powerUp.position.x, 2) +
        Math.pow(ballPosition.y - powerUp.position.y, 2) +
        Math.pow(ballPosition.z - powerUp.position.z, 2)
      );

      // ✅ Augmenter le rayon de collision pour faciliter la détection
      if (distance < 0.4)
      { // Était 0.25, maintenant 0.4
        Logger.log(`🎯 Collision detected! Distance: ${distance.toFixed(3)}, PowerUp: ${powerUp.type}`);
        return powerUp;
      }
    }

    return null;
  }

  /**
   * Active un power-up pour un joueur
   * @param powerUpId ID du power-up
   * @param targetPlayer Joueur cible
   */
  public activatePowerUp(powerUpId: string, targetPlayer: 'player1' | 'player2'): void
  {
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
    setTimeout(() =>
    {
      this.removePowerUp(powerUpId);
    }, 1000);

    Logger.log(`⚡ Activated power-up: ${config.name} for ${targetPlayer}`);
  }

  /**
   * Obtient les effets actifs
   * @returns Map des effets actifs
   */
  public getActiveEffects(): Map<string, ActiveEffect>
  {
    return new Map(this.activeEffects);
  }

  /**
   * Vérifie si un joueur a un effet actif
   * @param player Joueur
   * @param type Type d'effet
   * @returns True si l'effet est actif
   */
  public hasEffect(player: 'player1' | 'player2', type: PowerUpType): boolean
  {
    for (const effect of this.activeEffects.values())
    {
      if (effect.targetPlayer === player && effect.type === type)
      {
        return true;
      }
    }
    return false;
  }

  // ==========================================
  // MÉTHODES PUBLIQUES DE SYNCHRONISATION P2P
  // ==========================================

  /**
   * Obtient les power-ups actifs pour synchronisation
   * @returns Liste des power-ups actifs
   */
  public getActivePowerUps(): any[]
  {
    const activePowerUps = [];
    for (const [id, powerUp] of this.powerUps.entries())
    {
      activePowerUps.push({
        id: id,
        type: powerUp.type,
        position: {
          x: powerUp.mesh.position.x,
          y: powerUp.mesh.position.y,
          z: powerUp.mesh.position.z
        },
        scale: {
          x: powerUp.mesh.scaling.x,
          y: powerUp.mesh.scaling.y,
          z: powerUp.mesh.scaling.z
        },
        rotation: powerUp.mesh.rotation.y,
        spawned: powerUp.spawned,
        lifespan: powerUp.lifespan
      });
    }
    return activePowerUps;
  }

  /**
   * Obtient les effets des paddles pour synchronisation
   * @returns Effets des paddles
   */
  public getPaddleEffects(): any
  {
    const effects: any = {};
    for (const [id, effect] of this.activeEffects.entries())
    {
      effects[effect.targetPlayer] = effects[effect.targetPlayer] || [];
      effects[effect.targetPlayer].push({
        id: id,
        type: effect.type,
        effects: effect.effects,
        startTime: effect.startTime,
        duration: effect.duration
      });
    }
    return effects;
  }

  /**
   * Synchronise les power-ups actifs depuis l'hôte
   * @param remotePowerUps Power-ups distants
   */
  public syncActivePowerUps(remotePowerUps: any[]): void
  {
    // Supprimer les power-ups qui n'existent plus côté host
    const remoteIds = new Set(remotePowerUps.map(p => p.id));
    const toRemove = [];
    for (const [id] of this.powerUps.entries())
    {
      if (!remoteIds.has(id))
      {
        toRemove.push(id);
      }
    }
    toRemove.forEach(id => this.removePowerUp(id));

    // Ajouter ou mettre à jour les power-ups
    for (const remotePowerUp of remotePowerUps)
    {
      let localPowerUp = this.powerUps.get(remotePowerUp.id);

      if (!localPowerUp)
      {
        // Créer un nouveau power-up
        const config = this.configs.get(remotePowerUp.type);
        if (config)
        {
          localPowerUp = this.createPowerUpMesh(remotePowerUp.id, config);
          this.powerUps.set(remotePowerUp.id, localPowerUp);
        }
      }

      if (localPowerUp)
      {
        // ✅ Mettre à jour la position avec validation de Y
        const posY = Math.max(remotePowerUp.position.y, 0.3); // Minimum Y = 0.3 pour éviter l'enfoncement

        localPowerUp.mesh.position.set(
          remotePowerUp.position.x,
          posY, // Position Y corrigée
          remotePowerUp.position.z
        );

        // Mettre à jour la position stockée aussi
        localPowerUp.position = {
          x: remotePowerUp.position.x,
          y: posY,
          z: remotePowerUp.position.z
        };

        localPowerUp.mesh.scaling.set(
          remotePowerUp.scale.x,
          remotePowerUp.scale.y,
          remotePowerUp.scale.z
        );
        localPowerUp.mesh.rotation.y = remotePowerUp.rotation;
        localPowerUp.spawned = remotePowerUp.spawned;
        localPowerUp.lifespan = remotePowerUp.lifespan;

        Logger.log(`🔋 Guest synced power-up ${remotePowerUp.id} at position Y: ${posY}`);
      }
    }
  }

  /**
   * Synchronise les effets des paddles depuis l'hôte
   * @param remoteEffects Effets distants
   */
  public syncPaddleEffects(remoteEffects: any): void
  {
    // Nettoyer les effets actuels
    this.activeEffects.clear();

    // Appliquer les effets du host
    for (const [targetPlayer, effects] of Object.entries(remoteEffects))
    {
      if (Array.isArray(effects))
      {
        for (const effect of effects)
        {
          this.activeEffects.set(effect.id, {
            id: effect.id,
            type: effect.type,
            targetPlayer: targetPlayer as 'player1' | 'player2',
            effects: effect.effects,
            startTime: effect.startTime,
            duration: effect.duration
          });
        }
      }
    }
  }

  // ==========================================
  // MÉTHODES PUBLIQUES UTILITAIRES
  // ==========================================

  /**
   * Libère les ressources
   */
  public dispose(): void
  {
    this.clearAllPowerUps();
    this.clearAllEffects();
  }

  // ==========================================
  // MÉTHODES PRIVÉES DE SPAWN
  // ==========================================

  /**
   * Fait apparaître un power-up aléatoire
   */
  private spawnRandomPowerUp(): void
  {
    const types = Array.from(this.configs.keys());
    const weights = types.map(type => this.configs.get(type)!.spawnWeight);
    const selectedType = this.weightedRandomSelect(types, weights);

    const position = this.getRandomSpawnPosition();
    this.createPowerUp(selectedType, position);
  }

  /**
   * Sélectionne un élément pondéré aléatoirement
   * @param items Éléments à choisir
   * @param weights Poids de chaque élément
   * @returns Élément sélectionné
   */
  private weightedRandomSelect<T>(items: T[], weights: number[]): T
  {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++)
    {
      random -= weights[i];
      if (random <= 0)
      {
        return items[i];
      }
    }

    return items[items.length - 1];
  }

  /**
   * Obtient une position de spawn aléatoire
   * @returns Position de spawn
   */
  private getRandomSpawnPosition(): { x: number; y: number; z: number }
  {
    return {
      x: (Math.random() - 0.5) * 6, // Entre -3 et 3
      y: 0.3,
      z: (Math.random() - 0.5) * 4  // Entre -2 et 2
    };
  }

  /**
   * Crée un power-up
   * @param type Type du power-up
   * @param position Position du power-up
   */
  private createPowerUp(type: PowerUpType, position: { x: number; y: number; z: number }): void
  {
    const config = this.configs.get(type)!;
    const id = `powerup_${Date.now()}_${Math.random()}`;

    Logger.log(`🔧 Creating power-up of type: ${type}`); // ✅ Debug

    // ✅ Créer un mesh spécifique selon le type de power-up
    let mesh: BABYLON.Mesh;

    switch (type)
    {
      case PowerUpType.PADDLE_SIZE:
        mesh = this.createPaddleSizeMesh(id);
        Logger.log('📏 Created paddle size mesh');
        break;
      case PowerUpType.REVERSE_CONTROLS:
        mesh = this.createReverseControlsMesh(id);
        Logger.log('🔄 Created reverse controls mesh');
        break;
      case PowerUpType.FREEZE_OPPONENT:
        mesh = this.createFreezeMesh(id);
        Logger.log('❄️ Created freeze mesh');
        break;
      default:
        mesh = this.createDefaultMesh(id, config.color);
        Logger.log('⚪ Created default mesh for', type);
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
    Logger.log(`🔋 Spawned power-up: ${config.name} at`, position);
  }

  // ==========================================
  // MÉTHODES PRIVÉES DE CRÉATION DES MESHES
  // ==========================================

  /**
   * Crée le mesh pour le power-up taille de paddle
   * @param id ID du mesh
   * @returns Mesh créé
   */
  private createPaddleSizeMesh(id: string): BABYLON.Mesh
  {
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

  /**
   * Crée le mesh pour le power-up contrôles inversés
   * @param id ID du mesh
   * @returns Mesh créé
   */
  private createReverseControlsMesh(id: string): BABYLON.Mesh
  {
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
    for (let i = 0; i < 4; i++)
    {
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

  /**
   * Crée le mesh pour le power-up gel
   * @param id ID du mesh
   * @returns Mesh créé
   */
  private createFreezeMesh(id: string): BABYLON.Mesh
  {
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
    for (let i = 0; i < 4; i++)
    {
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

  /**
   * Crée un mesh par défaut
   * @param id ID du mesh
   * @param color Couleur du mesh
   * @returns Mesh créé
   */
  private createDefaultMesh(id: string, color: BABYLON.Color3): BABYLON.Mesh
  {
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

  // ==========================================
  // MÉTHODES PRIVÉES D'ANIMATION
  // ==========================================

  /**
   * Anime un power-up
   * @param mesh Mesh à animer
   */
  private animatePowerUp(mesh: BABYLON.Mesh): void
  {
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

  // ==========================================
  // MÉTHODES PRIVÉES DE MISE À JOUR
  // ==========================================

  /**
   * Met à jour les power-ups
   */
  private updatePowerUps(): void
  {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [id, powerUp] of this.powerUps.entries())
    {
      if (now > powerUp.expiresAt && !powerUp.isActive)
      {
        toRemove.push(id);
      }
    }

    toRemove.forEach(id => this.removePowerUp(id));
  }

  /**
   * Met à jour les effets actifs
   */
  private updateActiveEffects(): void
  {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [id, effect] of this.activeEffects.entries())
    {
      if (now > effect.startTime + effect.duration)
      {
        toRemove.push(id);
      }
    }

    toRemove.forEach(id =>
    {
      const effect = this.activeEffects.get(id);
      if (effect)
      {
        Logger.log(`⏰ Effect expired: ${effect.type} for ${effect.targetPlayer}`);
        this.activeEffects.delete(id);
      }
    });
  }

  // ==========================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // ==========================================

  /**
   * Supprime un power-up
   * @param id ID du power-up
   */
  private removePowerUp(id: string): void
  {
    const powerUp = this.powerUps.get(id);
    if (powerUp)
    {
      powerUp.mesh.dispose();
      this.powerUps.delete(id);
    }
  }

  /**
   * Supprime tous les power-ups
   */
  private clearAllPowerUps(): void
  {
    for (const powerUp of this.powerUps.values())
    {
      powerUp.mesh.dispose();
    }
    this.powerUps.clear();
  }

  /**
   * Supprime tous les effets
   */
  private clearAllEffects(): void
  {
    this.activeEffects.clear();
  }

  // ==========================================
  // MÉTHODES PRIVÉES DE SYNCHRONISATION
  // ==========================================

  /**
   * Crée un mesh de power-up pour synchronisation
   * @param id ID du power-up
   * @param config Configuration du power-up
   * @returns Power-up créé
   */
  private createPowerUpMesh(id: string, config: PowerUpConfig): PowerUp
  {
    Logger.log(`🔧 Creating power-up mesh for sync: ${config.type}`);

    let mesh: BABYLON.Mesh;

    switch (config.type)
    {
      case PowerUpType.PADDLE_SIZE:
        mesh = this.createPaddleSizeMesh(id);
        break;
      case PowerUpType.REVERSE_CONTROLS:
        mesh = this.createReverseControlsMesh(id);
        break;
      case PowerUpType.FREEZE_OPPONENT:
        mesh = this.createFreezeMesh(id);
        break;
      default:
        mesh = this.createDefaultMesh(id, config.color);
    }

    // Position Y par défaut valide pour éviter l'enfoncement
    mesh.position.y = 0.3;

    // Animation de rotation et flottement
    this.animatePowerUp(mesh);

    const powerUp: PowerUp = {
      id,
      type: config.type,
      position: { x: 0, y: 0.3, z: 0 }, // Position Y valide par défaut
      mesh,
      duration: config.duration,
      isActive: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + (config.lifespan * 1000),
      spawned: 0,
      lifespan: config.lifespan
    };

    this.scene.addMesh(mesh);
    Logger.log(`🎮 Created power-up mesh ${id} at Y: 0.3`);

    return powerUp;
  }
}