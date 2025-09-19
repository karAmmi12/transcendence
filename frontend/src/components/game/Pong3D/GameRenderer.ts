import * as BABYLON from '@babylonjs/core';
import { GameThemes } from '../themes/GameThemes.js'; 
import { EffectsManager } from './effects/EffectsManager.js'; 
import type { ThemeConfig, MaterialConfig, GameObjects, ObjectPositions } from '@/types/index.js';


export class GameRenderer {
  private scene: BABYLON.Scene;
  private camera: BABYLON.ArcRotateCamera;
  private gameObjects: GameObjects;
  private canvas: HTMLCanvasElement;
  private meshes: any = {};
  private currentTheme: ThemeConfig;
  private effectsManager: EffectsManager | null = null;
  // private settings: GameSettings;

  // ✅ Nouvelles propriétés pour les modificateurs de paddles
  private paddleSizeMultipliers = {
    player1: 1.0,
    player2: 1.0
  };
  private basePaddleScales = {
    player1: { x: 1, y: 1, z: 1 },
    player2: { x: 1, y: 1, z: 1 }
  };

  constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement, theme: string = 'classic') 
  {
    this.scene = scene;
    this.canvas = canvas;
    this.currentTheme = GameThemes.getTheme(theme) || GameThemes.getTheme('classic');

    this.setupCamera();
    this.setupLighting();
    this.createGameObjects();
    this.setupEffects();
    this.createFieldBorders();

    this.adjustCameraForScreen();
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
    // Nettoyer les lumières existantes
    this.scene.lights.forEach(light => light.dispose());
    
    const theme = this.currentTheme;

    // Lumière ambiante
    const hemiLight = new BABYLON.HemisphericLight(
      'hemiLight',
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = theme.lighting.ambient;
    
    // Lumière directionnelle
    const dirLight = new BABYLON.DirectionalLight(
      'dirLight',
      new BABYLON.Vector3(-1, -1, -1),
      this.scene
    );
    dirLight.intensity = theme.lighting.directional;
    dirLight.position = new BABYLON.Vector3(5, 10, 5);
    
    // ✅ Éclairage spécial pour le thème italien
    if (theme.id === 'italian') {
      // Lumière douce focalisée sur la pizza
      const pizzaSpotLight = new BABYLON.SpotLight(
        'pizzaSpotLight',
        new BABYLON.Vector3(0, 3, 0),
        new BABYLON.Vector3(0, -1, 0),
        Math.PI / 3,
        2,
        this.scene
      );
      pizzaSpotLight.intensity = 0.8;
      pizzaSpotLight.diffuse = new BABYLON.Color3(1, 0.9, 0.7); // Lumière chaude
    }
    
    // ✅ CORRECTION: Vérifier que gameObjects existe avant d'ajouter les ombres
    if (theme.lighting.shadowsEnabled && this.gameObjects) {
      const shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight);
      shadowGenerator.addShadowCaster(this.gameObjects.ball);
      shadowGenerator.addShadowCaster(this.gameObjects.player1Paddle);
      shadowGenerator.addShadowCaster(this.gameObjects.player2Paddle);
      
      this.gameObjects.field.receiveShadows = true;
    }
    
    // Changer la couleur de fond
    this.scene.clearColor = theme.colors.background;
  }

  public isInitialized(): boolean {
    return this.gameObjects !== undefined && 
          this.gameObjects.player1Paddle !== undefined &&
          this.gameObjects.player2Paddle !== undefined &&
          this.gameObjects.ball !== undefined &&
          this.gameObjects.field !== undefined;
  }


  private createGameObjects(): void {
    // ✅ CORRECTION: Initialiser gameObjects avant de créer les objets
    this.gameObjects = {
      field: this.createField(),
      player1Paddle: this.createPaddle('player1', -4.5),
      player2Paddle: this.createPaddle('player2', 4.5),
      ball: this.createBall(),
      borders: []
    };

    // Créer les bordures
    this.createFieldBorders();

    // Stocker aussi dans meshes pour compatibilité
    this.meshes.field = this.gameObjects.field;
    this.meshes.player1Paddle = this.gameObjects.player1Paddle;
    this.meshes.player2Paddle = this.gameObjects.player2Paddle;
    this.meshes.ball = this.gameObjects.ball;

    // ✅ Sauvegarder les tailles de base des paddles
    this.basePaddleScales.player1 = {
      x: this.gameObjects.player1Paddle.scaling.x,
      y: this.gameObjects.player1Paddle.scaling.y,
      z: this.gameObjects.player1Paddle.scaling.z
    };
    this.basePaddleScales.player2 = {
      x: this.gameObjects.player2Paddle.scaling.x,
      y: this.gameObjects.player2Paddle.scaling.y,
      z: this.gameObjects.player2Paddle.scaling.z
    };
  }

  private createField(): BABYLON.Mesh {
    const field = BABYLON.MeshBuilder.CreateGround(
      'field',
      { width: 10, height: 6 },
      this.scene
    );
    
    const fieldMaterial = this.createMaterialFromConfig('field', this.currentTheme.materials.field);
    field.material = fieldMaterial;
    
    // Créer les éléments spécifiques selon le thème
    if (this.currentTheme.id === 'italian') {
      this.createItalianFieldElements();
    } else {
      this.createStandardFieldElements();
    }
    
    // ✅ CORRECTION: Retourner le mesh field
    return field;
  }

  private createStandardFieldElements(): void {
    // Ligne centrale standard
    const centerLine = BABYLON.MeshBuilder.CreateBox(
      'centerLine',
      { width: 0.1, height: 0.02, depth: 6 },
      this.scene
    );
    centerLine.position = new BABYLON.Vector3(0, 0.01, 0);
    
    const centerLineMaterial = new BABYLON.StandardMaterial('centerLineMaterial', this.scene);
    centerLineMaterial.emissiveColor = this.currentTheme.colors.centerLine;
    centerLine.material = centerLineMaterial;
  }

  private createItalianFieldElements(): void {
    // Pizza au centre du terrain
    this.createPizza();
    
    // Ligne de farine au lieu de ligne centrale classique
    const flourLine = BABYLON.MeshBuilder.CreateBox(
      'centerLine',
      { width: 0.05, height: 0.005, depth: 6 },
      this.scene
    );
    flourLine.position = new BABYLON.Vector3(0, 0.005, 0);
    
    const flourMaterial = new BABYLON.StandardMaterial('flourMaterial', this.scene);
    flourMaterial.diffuseColor = this.currentTheme.colors.centerLine;
    flourMaterial.alpha = 0.8; // Légèrement transparent
    flourLine.material = flourMaterial;
  }

  private createPizza(): void {
    // Base de la pizza (pâte)
    const pizzaBase = BABYLON.MeshBuilder.CreateCylinder(
      'pizzaBase',
      { 
        height: 0.02,
        diameter: 1.2,
        tessellation: 16
      },
      this.scene
    );
    pizzaBase.position = new BABYLON.Vector3(0, 0.01, 0);
    
    // Matériau de la pâte
    const baseMaterial = new BABYLON.StandardMaterial('pizzaBaseMaterial', this.scene);
    baseMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.6); // Couleur pâte
    baseMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.15);
    pizzaBase.material = baseMaterial;
    
    // Sauce tomate (cercle rouge plus petit)
    const tomatoSauce = BABYLON.MeshBuilder.CreateCylinder(
      'tomatoSauce',
      { 
        height: 0.005,
        diameter: 1.0,
        tessellation: 16
      },
      this.scene
    );
    tomatoSauce.position = new BABYLON.Vector3(0, 0.025, 0);
    
    const sauceMaterial = new BABYLON.StandardMaterial('tomatoSauceMaterial', this.scene);
    sauceMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.1); // Rouge tomate
    sauceMaterial.specularColor = new BABYLON.Color3(0.3, 0.1, 0.05);
    tomatoSauce.material = sauceMaterial;
    
    // Fromage (cercles blancs irréguliers)
    this.createCheesePatches();
    
    // Ingrédients décoratifs
    this.createPizzaToppings();
    
    console.log('🍕 Pizza created at center field for Italian theme');
  }

  private createCheesePatches(): void {
    // Créer plusieurs petites "plaques" de fromage pour un effet réaliste
    const cheesePositions = [
      { x: 0.2, z: 0.15 },
      { x: -0.25, z: 0.1 },
      { x: 0.1, z: -0.2 },
      { x: -0.15, z: -0.25 },
      { x: 0.3, z: -0.1 },
      { x: -0.1, z: 0.3 }
    ];
    
    cheesePositions.forEach((pos, index) => {
      const cheese = BABYLON.MeshBuilder.CreateCylinder(
        `cheese${index}`,
        { 
          height: 0.003,
          diameter: 0.15 + Math.random() * 0.1, // Taille variable
          tessellation: 8
        },
        this.scene
      );
      cheese.position = new BABYLON.Vector3(pos.x, 0.03, pos.z);
      
      const cheeseMaterial = new BABYLON.StandardMaterial(`cheeseMaterial${index}`, this.scene);
      cheeseMaterial.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.88); // Blanc mozzarella
      cheeseMaterial.specularColor = new BABYLON.Color3(0.4, 0.4, 0.35);
      cheeseMaterial.alpha = 0.9;
      cheese.material = cheeseMaterial;
    });
  }

  private createPizzaToppings(): void {
    // Quelques olives noires
    const olivePositions = [
      { x: 0.15, z: 0.25 },
      { x: -0.2, z: -0.15 },
      { x: 0.25, z: -0.3 }
    ];
    
    olivePositions.forEach((pos, index) => {
      const olive = BABYLON.MeshBuilder.CreateSphere(
        `olive${index}`,
        { diameter: 0.04 },
        this.scene
      );
      olive.position = new BABYLON.Vector3(pos.x, 0.035, pos.z);
      
      const oliveMaterial = new BABYLON.StandardMaterial(`oliveMaterial${index}`, this.scene);
      oliveMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.05, 0.1); // Noir olive
      oliveMaterial.specularColor = new BABYLON.Color3(0.2, 0.1, 0.2);
      olive.material = oliveMaterial;
    });
    
    // Quelques feuilles de basilic
    const basilPositions = [
      { x: -0.1, z: 0.2 },
      { x: 0.2, z: 0.05 },
      { x: -0.25, z: -0.1 },
      { x: 0.1, z: -0.25 }
    ];
    
    basilPositions.forEach((pos, index) => {
      const basil = BABYLON.MeshBuilder.CreateBox(
        `basil${index}`,
        { width: 0.06, height: 0.002, depth: 0.04 },
        this.scene
      );
      basil.position = new BABYLON.Vector3(pos.x, 0.035, pos.z);
      basil.rotation.y = Math.random() * Math.PI; // Rotation aléatoire
      
      const basilMaterial = new BABYLON.StandardMaterial(`basilMaterial${index}`, this.scene);
      basilMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.3); // Vert basilic
      basilMaterial.specularColor = new BABYLON.Color3(0.1, 0.3, 0.15);
      basil.material = basilMaterial;
    });
    
    // Quelques morceaux de tomate
    const tomatoPositions = [
      { x: 0.05, z: 0.1 },
      { x: -0.15, z: 0.05 },
      { x: 0.3, z: 0.2 }
    ];
    
    tomatoPositions.forEach((pos, index) => {
      const tomato = BABYLON.MeshBuilder.CreateBox(
        `tomato${index}`,
        { width: 0.05, height: 0.003, depth: 0.05 },
        this.scene
      );
      tomato.position = new BABYLON.Vector3(pos.x, 0.033, pos.z);
      
      const tomatoMaterial = new BABYLON.StandardMaterial(`tomatoMaterial${index}`, this.scene);
      tomatoMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.3, 0.2); // Rouge tomate
      tomatoMaterial.specularColor = new BABYLON.Color3(0.4, 0.15, 0.1);
      tomato.material = tomatoMaterial;
    });
  }

  private createFieldBorders(): void 
  {
    const borderMaterial = this.createMaterialFromConfig('borders', this.currentTheme.materials.borders);
    
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
    bottomBorder.material = borderMaterial.clone('bottomBorderMaterial');
    
    // Ajouter les bordures au gameObjects
    this.gameObjects.borders = [topBorder, bottomBorder];
  }
  
  private createPaddle(player: 'player1' | 'player2', xPosition: number): BABYLON.Mesh {
    let paddle: BABYLON.Mesh;
    
    if (this.currentTheme.id === 'italian') {
      // Créer un rouleau de pâtisserie cylindrique
      paddle = BABYLON.MeshBuilder.CreateCylinder(
        `${player}Paddle`,
        { 
          height: 1.2,        // Longueur du rouleau
          diameter: 0.20,     // Diamètre du rouleau
          tessellation: 16    // Pour un cylindre lisse
        },
        this.scene
      );
      
      // Orientation horizontale pour ressembler à un vrai rouleau
      paddle.rotation.x = Math.PI / 2; // Rotation de 90° pour l'orienter horizontalement
      
      // ✅ Poignées simples aux extrémités (plus petites et mieux positionnées)
      const handle1 = BABYLON.MeshBuilder.CreateSphere(
        `${player}Handle1`,
        { diameter: 0.08 }, // Poignée sphérique simple
        this.scene
      );
      // ✅ Positionner aux vrais bouts du rouleau (axe Y car le cylindre est tourné)
      handle1.position = new BABYLON.Vector3(0, 0.65, 0); // Un bout
      handle1.parent = paddle;
      
      const handle2 = BABYLON.MeshBuilder.CreateSphere(
        `${player}Handle2`,
        { diameter: 0.08 }, // Poignée sphérique simple
        this.scene
      );
      handle2.position = new BABYLON.Vector3(0, -0.65, 0); // Autre bout
      handle2.parent = paddle;
      
      // Matériau des poignées (bois plus foncé)
      const handleMaterial = new BABYLON.StandardMaterial(`${player}HandleMaterial`, this.scene);
      handleMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.25, 0.1); // Bois foncé
      handleMaterial.specularColor = new BABYLON.Color3(0.3, 0.2, 0.1);
      
      // Appliquer le matériau aux poignées
      handle1.material = handleMaterial;
      handle2.material = handleMaterial.clone(`${player}Handle2Material`);
      
    } else if (this.currentTheme.id === 'lava') {
      // ✅ Créer des paddles en forme de pierre volcanique avec lave
      paddle = BABYLON.MeshBuilder.CreateBox(
        `${player}Paddle`,
        { 
          width: 0.25,    // Un peu plus large pour l'aspect massif
          height: 0.15,   // Plus épais
          depth: 1.1      // Légèrement plus long
        },
        this.scene
      );
      
      // ✅ Ajouter des cristaux de lave sur les paddles
      this.createLavaCrystals(paddle, player);
      
      // ✅ Animation de pulsation pour simuler la lave qui bout
      this.animateLavaPaddle(paddle);
      
    } else {
      // Paddle standard pour les autres thèmes
      paddle = BABYLON.MeshBuilder.CreateBox(
        `${player}Paddle`,
        { width: 0.2, height: 0.4, depth: 1 },
        this.scene
      );
    }
    
    paddle.position = new BABYLON.Vector3(xPosition, 0.15, 0); // Légèrement plus haut pour le cylindre
    
    const paddleMaterial = this.createMaterialFromConfig(`${player}Paddle`, this.currentTheme.materials.paddles);
    
    // Appliquer la couleur spécifique au joueur selon le type de matériau
    if (paddleMaterial instanceof BABYLON.StandardMaterial) {
      paddleMaterial.diffuseColor = this.currentTheme.colors[`${player}Paddle`];
      
      // ✅ Améliorer l'apparence selon le thème
      if (this.currentTheme.id === 'italian') {
        paddleMaterial.specularColor = new BABYLON.Color3(0.3, 0.2, 0.15);
      } else if (this.currentTheme.id === 'lava') {
        // ✅ Effet de lave brillante et chaude
        paddleMaterial.specularColor = new BABYLON.Color3(0.8, 0.3, 0.1); // Brillance orangée
        paddleMaterial.emissiveColor = new BABYLON.Color3(0.15, 0.03, 0.01); // Lueur interne
      }
    } else if (paddleMaterial instanceof BABYLON.PBRMaterial) {
      paddleMaterial.albedoColor = this.currentTheme.colors[`${player}Paddle`];
    }
    
    paddle.material = paddleMaterial;
    
    return paddle;
  }

  public applyPaddleSizeModifier(player: 'player1' | 'player2', multiplier: number): void {
    this.paddleSizeMultipliers[player] = multiplier;
    
    // ✅ CORRECTION: Utiliser gameObjects au lieu de meshes
    const paddle = this.gameObjects?.[`${player}Paddle`];
    if (paddle) {
      const baseScale = this.basePaddleScales[player];
      paddle.scaling = new BABYLON.Vector3(
        baseScale.x,
        baseScale.y * multiplier, // Augmenter la hauteur du paddle
        baseScale.z * multiplier  // Augmenter la profondeur du paddle
      );
      console.log(`📏 ${player} paddle size multiplier: ${multiplier}`);
    } else {
      console.warn(`🚨 ${player}Paddle not found in gameObjects`);
    }
  }


  public resetPaddleSize(player?: 'player1' | 'player2'): void {
    if (player) {
      this.paddleSizeMultipliers[player] = 1.0;
      // ✅ CORRECTION: Utiliser gameObjects au lieu de meshes
      const paddle = this.gameObjects?.[`${player}Paddle`];
      if (paddle) {
        const baseScale = this.basePaddleScales[player];
        paddle.scaling = new BABYLON.Vector3(baseScale.x, baseScale.y, baseScale.z);
      }
    } else {
      this.resetPaddleSize('player1');
      this.resetPaddleSize('player2');
    }
  }

  // ✅ Nouvelle méthode pour créer des cristaux de lave
  private createLavaCrystals(paddle: BABYLON.Mesh, player: string): void {
    // Positions aléatoires pour les cristaux sur le paddle
    const crystalPositions = [
      { x: 0.08, y: 0.05, z: 0.3 },
      { x: -0.06, y: 0.04, z: -0.2 },
      { x: 0.04, y: 0.06, z: 0.1 },
      { x: -0.08, y: 0.03, z: 0.4 }
    ];
    
    crystalPositions.forEach((pos, index) => {
      // Créer des cristaux de formes irrégulières
      const crystal = BABYLON.MeshBuilder.CreateSphere(
        `${player}Crystal${index}`,
        { 
          diameter: 0.02 + Math.random() * 0.015, // Taille variable
          segments: 6 // Moins de segments pour un aspect plus rugueux
        },
        this.scene
      );
      
      crystal.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
      crystal.scaling = new BABYLON.Vector3(
        1 + Math.random() * 0.5,
        0.8 + Math.random() * 0.4,
        1 + Math.random() * 0.3
      ); // Déformation aléatoire
      crystal.parent = paddle;
      
      // Matériau cristallin avec effet de lave
      const crystalMaterial = new BABYLON.StandardMaterial(`${player}CrystalMaterial${index}`, this.scene);
      crystalMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.4, 0.1); // Orange vif
      crystalMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.02); // Lueur chaude
      crystalMaterial.specularColor = new BABYLON.Color3(1, 0.6, 0.2); // Brillance de cristal
      crystal.material = crystalMaterial;
    });
  }

  // ✅ Animation de pulsation pour les paddles de lave
  private animateLavaPaddle(paddle: BABYLON.Mesh): void {
    // Animation de pulsation pour simuler la lave qui bout
    const animationGroup = new BABYLON.AnimationGroup('lavaPaddleAnimation', this.scene);
    
    // Animation de l'émission de lumière
    const emissiveAnimation = new BABYLON.Animation(
      'emissiveAnimation',
      'material.emissiveColor',
      30, // 30 FPS
      BABYLON.Animation.ANIMATIONTYPE_COLOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    
    const emissiveKeys = [
      { frame: 0, value: new BABYLON.Color3(0.1, 0.02, 0) },
      { frame: 30, value: new BABYLON.Color3(0.2, 0.05, 0.01) },
      { frame: 60, value: new BABYLON.Color3(0.1, 0.02, 0) }
    ];
    
    emissiveAnimation.setKeys(emissiveKeys);
    animationGroup.addTargetedAnimation(emissiveAnimation, paddle);
    
    // Animation de léger scale pour l'effet de chaleur
    const scaleAnimation = new BABYLON.Animation(
      'scaleAnimation',
      'scaling.y',
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    
    const scaleKeys = [
      { frame: 0, value: 1.0 },
      { frame: 45, value: 1.02 },
      { frame: 90, value: 1.0 }
    ];
    
    scaleAnimation.setKeys(scaleKeys);
    animationGroup.addTargetedAnimation(scaleAnimation, paddle);
    
    // Démarrer l'animation avec un délai aléatoire pour chaque paddle
    const randomDelay = Math.random() * 2000;
    setTimeout(() => {
      animationGroup.play(true); // Loop
    }, randomDelay);
    
    console.log(`🌋 Lava paddle animation created for ${paddle.name}`);
  }
  private createBall(): BABYLON.Mesh {
    let ball: BABYLON.Mesh;
    
    if (this.currentTheme.id === 'italian') {
      // ✅ Créer une balle légèrement ovale pour l'effet mozzarella
      ball = BABYLON.MeshBuilder.CreateSphere(
        'ball',
        { 
          diameter: 0.3,
          diameterX: 0.32, // ✅ Légèrement plus large en X
          diameterY: 0.28, // ✅ Légèrement plus court en Y
          diameterZ: 0.3   // ✅ Normal en Z
        },
        this.scene
      );
    } else {
      // Balle normale pour les autres thèmes
      ball = BABYLON.MeshBuilder.CreateSphere(
        'ball',
        { diameter: 0.3 },
        this.scene
      );
    }
    
    ball.position = new BABYLON.Vector3(0, 0.15, 0);
    
    const ballMaterial = this.createMaterialFromConfig('ball', this.currentTheme.materials.ball);
    ball.material = ballMaterial;
    
    return ball;
  }

  private createMaterialFromConfig(name: string, config: MaterialConfig): BABYLON.Material {
    let material: BABYLON.Material;
    
    switch (config.type) {
      case 'pbr':
        const pbrMaterial = new BABYLON.PBRMaterial(`${name}PBRMaterial`, this.scene);
        if (config.properties.diffuseColor) {
          pbrMaterial.albedoColor = config.properties.diffuseColor;
        }
        if (config.properties.metallic !== undefined) {
          pbrMaterial.metallic = config.properties.metallic;
        }
        if (config.properties.roughness !== undefined) {
          pbrMaterial.roughness = config.properties.roughness;
        }
        material = pbrMaterial;
        break;
        
      case 'emissive':
        const emissiveMaterial = new BABYLON.StandardMaterial(`${name}EmissiveMaterial`, this.scene);
        if (config.properties.emissiveColor) {
          emissiveMaterial.emissiveColor = config.properties.emissiveColor;
        }
        if (config.properties.diffuseColor) {
          emissiveMaterial.diffuseColor = config.properties.diffuseColor;
        }
        material = emissiveMaterial;
        break;
        
      default: // 'standard'
        const standardMaterial = new BABYLON.StandardMaterial(`${name}StandardMaterial`, this.scene);
        if (config.properties.diffuseColor) {
          standardMaterial.diffuseColor = config.properties.diffuseColor;
        }
        if (config.properties.specularColor) {
          standardMaterial.specularColor = config.properties.specularColor;
        }
        if (config.properties.emissiveColor) {
          standardMaterial.emissiveColor = config.properties.emissiveColor;
        }
        material = standardMaterial;
        break;
    }
    
    // Appliquer la transparence si définie
    if (config.properties.transparency !== undefined) {
      material.alpha = 1 - config.properties.transparency;
    }
    
    return material;
  }

   private setupEffects(): void {
    if (this.currentTheme.effects.ballTrail || this.currentTheme.effects.particles || this.currentTheme.effects.glow) {
      this.effectsManager = new EffectsManager(this.scene, this.currentTheme);
      
      if (this.currentTheme.effects.ballTrail) {
        this.effectsManager.enableBallTrail(this.gameObjects.ball);
      }
      
      if (this.currentTheme.effects.particles) {
        this.effectsManager.enableParticles();
      }
      
      if (this.currentTheme.effects.glow) {
        this.effectsManager.enableGlow([
          this.gameObjects.ball,
          this.gameObjects.player1Paddle,
          this.gameObjects.player2Paddle
        ]);
      }
    }
  }

  public changeTheme(themeId: string): void {
    const newTheme = GameThemes.getTheme(themeId);
    if (!newTheme) return;
    
    this.currentTheme = newTheme;
    
    // Recréer tous les objets avec le nouveau thème
    this.disposeGameObjects();
    this.setupLighting();
    this.createGameObjects();
    this.setupEffects();
  }

  private disposeGameObjects(): void {
    if (this.gameObjects) {
      Object.values(this.gameObjects).forEach(obj => {
        if (obj.material) obj.material.dispose();
        obj.dispose();
      });
    }
    
    // Nettoyer les éléments spécifiques aux thèmes
    this.disposeThemeSpecificElements();
    
    if (this.effectsManager) {
      this.effectsManager.dispose();
      this.effectsManager = null;
    }
  }

  private disposeThemeSpecificElements(): void {
    // Nettoyer la pizza et ses éléments
    const pizzaElements = [
      'pizzaBase', 'tomatoSauce', 'centerLine',
      'cheese0', 'cheese1', 'cheese2', 'cheese3', 'cheese4', 'cheese5',
      'olive0', 'olive1', 'olive2',
      'basil0', 'basil1', 'basil2', 'basil3',
      'tomato0', 'tomato1', 'tomato2',
      'topBorder', 'bottomBorder'
    ];
    
    // ✅ Poignées italiennes
    const rollingPinElements = [
      'player1Handle1', 'player1Handle2',
      'player2Handle1', 'player2Handle2'
    ];
    
    // ✅ Cristaux de lave
    const lavaElements = [
      'player1Crystal0', 'player1Crystal1', 'player1Crystal2', 'player1Crystal3',
      'player2Crystal0', 'player2Crystal1', 'player2Crystal2', 'player2Crystal3'
    ];
    
    [...pizzaElements, ...rollingPinElements, ...lavaElements].forEach(name => {
      const element = this.scene.getMeshByName(name);
      if (element) {
        if (element.material) element.material.dispose();
        element.dispose();
      }
    });
    
    // ✅ Nettoyer les groupes d'animation
    this.scene.animationGroups.forEach(group => {
      if (group.name === 'lavaPaddleAnimation') {
        group.dispose();
      }
    });
  }


  public updatePositions(positions: ObjectPositions): void {
    // ✅ CORRECTION: Vérifier que gameObjects existe avant de l'utiliser
    if (!this.gameObjects) {
      console.warn('🚨 GameObjects not initialized yet');
      return;
    }

    // Mettre à jour les positions des objets
    if (this.gameObjects.player1Paddle) {
      this.gameObjects.player1Paddle.position.z = positions.player1Paddle.z;
    }
    
    if (this.gameObjects.player2Paddle) {
      this.gameObjects.player2Paddle.position.z = positions.player2Paddle.z;
    }
    
    if (this.gameObjects.ball) {
      this.gameObjects.ball.position.x = positions.ball.x;
      this.gameObjects.ball.position.y = positions.ball.y;
      this.gameObjects.ball.position.z = positions.ball.z;
    }
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