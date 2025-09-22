import * as BABYLON from '@babylonjs/core';
import type { ThemeConfig } from '@/types/index.js';

export class EffectsManager {
  private scene: BABYLON.Scene;
  private theme: ThemeConfig;
  private trailSystem: BABYLON.TrailMesh | null = null;
  private particleSystem: BABYLON.ParticleSystem | null = null;
  private glowLayer: BABYLON.GlowLayer | null = null;
  private fieldAnimationTimer: number = 0;
  private beforeRenderObserver: BABYLON.Nullable<BABYLON.Observer<BABYLON.Scene>> = null;

  constructor(scene: BABYLON.Scene, theme: ThemeConfig) {
    this.scene = scene;
    this.theme = theme;
  }

  // Mise à jour de enableBallTrail pour l'effet mozzarella
  enableBallTrail(ball: BABYLON.Mesh): void {
    if (this.trailSystem) {
      this.trailSystem.dispose();
    }

    // Adapter les paramètres selon le thème
    let trailDiameter = 0.05;
    let trailLength = 30;
    
    if (this.theme.id === 'italian') {
      trailDiameter = 0.04; // ✅ Plus fin pour un effet plus subtil
      trailLength = 20;     // ✅ Plus court pour éviter l'étirement excessif
    } else if (this.theme.id === 'lava') {
      trailDiameter = 0.08;
      trailLength = 40;
    }

    this.trailSystem = new BABYLON.TrailMesh(
      'ballTrail',
      ball,
      this.scene,
      trailDiameter,
      trailLength,
      true
    );

    const trailMaterial = new BABYLON.StandardMaterial('trailMaterial', this.scene);
    
    // Adapter la traînée selon le thème
    switch (this.theme.id) {
      case 'italian':
        // Effet mozzarella qui s'étire légèrement
        trailMaterial.diffuseColor = new BABYLON.Color3(0.95, 0.92, 0.85);
        trailMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.18); // ✅ Réduit la brillance
        trailMaterial.emissiveColor = new BABYLON.Color3(0.01, 0.01, 0.005); // ✅ Réduit la lueur
        trailMaterial.alpha = 0.5; // ✅ Plus transparent pour un effet plus subtil
        break;
      case 'lava':
        trailMaterial.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
        trailMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0);
        break;
      case 'matrix':
        trailMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0.2);
        trailMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 0.1);
        break;
      default:
        trailMaterial.emissiveColor = this.theme.colors.ball;
        trailMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    }
    
    trailMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    this.trailSystem.material = trailMaterial;

    console.log(`🎯 ${this.theme.name} ball trail enabled`);
  }

  // Ajouter un effet de vapeur pour la cuisine
  private createSteamEffect(): void {
    if (this.theme.id !== 'italian') return;

    const steamSystem = new BABYLON.ParticleSystem('steam', 300, this.scene);
    
    steamSystem.particleTexture = new BABYLON.Texture('data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="steam" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.3"/>
            <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0"/>
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="15" fill="url(#steam)"/>
      </svg>
    `), this.scene);

    // Émission depuis les coins comme si la cuisine était chaude
    steamSystem.emitter = new BABYLON.Vector3(0, 0.1, 0);
    steamSystem.minEmitBox = new BABYLON.Vector3(-4.5, 0, -2.8);
    steamSystem.maxEmitBox = new BABYLON.Vector3(4.5, 0, 2.8);

    steamSystem.color1 = new BABYLON.Color4(1, 1, 1, 0.2);
    steamSystem.color2 = new BABYLON.Color4(0.95, 0.95, 0.95, 0.1);
    steamSystem.colorDead = new BABYLON.Color4(0.9, 0.9, 0.9, 0);

    steamSystem.minSize = 0.1;
    steamSystem.maxSize = 0.3;
    steamSystem.minLifeTime = 3;
    steamSystem.maxLifeTime = 6;
    steamSystem.emitRate = 8;

    // Mouvement vertical comme de la vapeur
    steamSystem.direction1 = new BABYLON.Vector3(-0.1, 1, -0.1);
    steamSystem.direction2 = new BABYLON.Vector3(0.1, 2, 0.1);
    steamSystem.gravity = new BABYLON.Vector3(0, 0.1, 0); // Légèrement vers le haut

    steamSystem.start();
    console.log('💨 Italian kitchen steam effect enabled');
  }

  enableParticles(): void {
    if (this.particleSystem) {
      this.particleSystem.dispose();
    }

    // Créer le système de particules
    this.particleSystem = new BABYLON.ParticleSystem('particles', 1000, this.scene);
    
    // Adapter les particules selon le thème
    switch (this.theme.id) {
      case 'italian':
        this.createFlourParticles();
        break;
      case 'lava':
        this.createLavaParticles();
        break;
      case 'matrix':
        // Pas de particules pour Matrix (on utilise la pluie de code)
        return;
      default:
        this.createGenericParticles();
    }
  }

  private createFlourParticles(): void {
    if (!this.particleSystem) return;

    // Texture améliorée pour la farine
    this.particleSystem.particleTexture = new BABYLON.Texture('data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="flour" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.9"/>
            <stop offset="70%" style="stop-color:#f8f8f5;stop-opacity:0.7"/>
            <stop offset="100%" style="stop-color:#f0f0ed;stop-opacity:0"/>
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="14" fill="url(#flour)"/>
      </svg>
    `), this.scene);

    // Configuration pour un effet de farine plus visible
    this.particleSystem.emitter = new BABYLON.Vector3(0, 0.4, 0);
    this.particleSystem.minEmitBox = new BABYLON.Vector3(-4, 0, -2.5);
    this.particleSystem.maxEmitBox = new BABYLON.Vector3(4, 0.3, 2.5);

    // Couleurs de la farine plus visibles
    this.particleSystem.color1 = new BABYLON.Color4(0.98, 0.95, 0.88, 0.8); // ✅ Plus opaque
    this.particleSystem.color2 = new BABYLON.Color4(0.95, 0.92, 0.85, 0.6); // ✅ Plus opaque
    this.particleSystem.colorDead = new BABYLON.Color4(0.9, 0.87, 0.8, 0);

    this.particleSystem.minSize = 0.03; // ✅ Particules plus grandes
    this.particleSystem.maxSize = 0.09; // ✅ Particules plus grandes
    this.particleSystem.minLifeTime = 4;
    this.particleSystem.maxLifeTime = 8;
    this.particleSystem.emitRate = 15; // ✅ Plus de particules

    // Mouvement plus lent et visible
    this.particleSystem.gravity = new BABYLON.Vector3(0, -0.4, 0);
    this.particleSystem.direction1 = new BABYLON.Vector3(-0.2, 0.3, -0.2);
    this.particleSystem.direction2 = new BABYLON.Vector3(0.2, 0.9, 0.2);

    this.particleSystem.minEmitPower = 0.2;
    this.particleSystem.maxEmitPower = 0.6;

    this.particleSystem.start();

    // ✅ Créer les ingrédients avec un délai pour les voir séparément
    setTimeout(() => {
      this.createIngredientParticles();
    }, 500);

    console.log('🍕 Italian flour particles enabled');
  }

  private createIngredientParticles(): void {
    // ✅ Système séparé pour les tomates (rouge)
    const tomatoSystem = new BABYLON.ParticleSystem('tomatoes', 100, this.scene);
    
    tomatoSystem.particleTexture = new BABYLON.Texture('data:image/svg+xml;base64,' + btoa(`
      <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="tomato" cx="30%" cy="30%" r="70%">
            <stop offset="0%" style="stop-color:#ff6b4a;stop-opacity:1"/>
            <stop offset="60%" style="stop-color:#ff4526;stop-opacity:0.9"/>
            <stop offset="100%" style="stop-color:#cc2200;stop-opacity:0.7"/>
          </radialGradient>
        </defs>
        <circle cx="10" cy="10" r="8" fill="url(#tomato)"/>
        <circle cx="7" cy="7" r="2" fill="#ff8866" opacity="0.6"/>
      </svg>
    `), this.scene);

    tomatoSystem.emitter = new BABYLON.Vector3(0, 0.6, 0);
    tomatoSystem.minEmitBox = new BABYLON.Vector3(-2, 0, -1.5);
    tomatoSystem.maxEmitBox = new BABYLON.Vector3(2, 0.4, 1.5);

    // Couleurs des tomates plus visibles
    tomatoSystem.color1 = new BABYLON.Color4(1, 0.42, 0.29, 0.9); // ✅ Plus opaque
    tomatoSystem.color2 = new BABYLON.Color4(0.8, 0.25, 0.15, 0.8); // ✅ Plus opaque
    tomatoSystem.colorDead = new BABYLON.Color4(0.5, 0.1, 0.05, 0);

    tomatoSystem.minSize = 0.025; // ✅ Plus grandes
    tomatoSystem.maxSize = 0.06;  // ✅ Plus grandes
    tomatoSystem.minLifeTime = 8; // ✅ Plus longues
    tomatoSystem.maxLifeTime = 15;
    tomatoSystem.emitRate = 2; // ✅ Plus fréquent

    tomatoSystem.gravity = new BABYLON.Vector3(0, -0.3, 0);
    tomatoSystem.direction1 = new BABYLON.Vector3(-0.3, 0.8, -0.3);
    tomatoSystem.direction2 = new BABYLON.Vector3(0.3, 1.2, 0.3);

    tomatoSystem.start();

    // ✅ Système séparé pour le basilic (vert)
    const basilSystem = new BABYLON.ParticleSystem('basil', 80, this.scene);
    
    basilSystem.particleTexture = new BABYLON.Texture('data:image/svg+xml;base64,' + btoa(`
      <svg width="16" height="20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="basil" cx="50%" cy="30%" r="70%">
            <stop offset="0%" style="stop-color:#4ade80;stop-opacity:1"/>
            <stop offset="70%" style="stop-color:#22c55e;stop-opacity:0.9"/>
            <stop offset="100%" style="stop-color:#166534;stop-opacity:0.6"/>
          </radialGradient>
        </defs>
        <ellipse cx="8" cy="10" rx="6" ry="9" fill="url(#basil)"/>
        <ellipse cx="6" cy="7" rx="2" ry="3" fill="#86efac" opacity="0.7"/>
      </svg>
    `), this.scene);

    basilSystem.emitter = new BABYLON.Vector3(0, 0.7, 0);
    basilSystem.minEmitBox = new BABYLON.Vector3(-2.5, 0, -2);
    basilSystem.maxEmitBox = new BABYLON.Vector3(2.5, 0.3, 2);

    // Couleurs du basilic plus visibles
    basilSystem.color1 = new BABYLON.Color4(0.3, 0.9, 0.4, 0.9); // ✅ Plus opaque
    basilSystem.color2 = new BABYLON.Color4(0.15, 0.7, 0.25, 0.8); // ✅ Plus opaque
    basilSystem.colorDead = new BABYLON.Color4(0.1, 0.4, 0.15, 0);

    basilSystem.minSize = 0.02;
    basilSystem.maxSize = 0.05;
    basilSystem.minLifeTime = 10; // ✅ Encore plus longues
    basilSystem.maxLifeTime = 20;
    basilSystem.emitRate = 1.5; // ✅ Plus rare que les tomates

    basilSystem.gravity = new BABYLON.Vector3(0, -0.2, 0); // ✅ Plus lent que les tomates
    basilSystem.direction1 = new BABYLON.Vector3(-0.2, 0.6, -0.2);
    basilSystem.direction2 = new BABYLON.Vector3(0.2, 1, 0.2);

    basilSystem.start();

    console.log('🍅🌿 Italian ingredients (tomatoes & basil) particles enabled');
  }
  private createLavaParticles(): void {
    if (!this.particleSystem) return;

    // Texture simple pour les particules de lave
    this.particleSystem.particleTexture = new BABYLON.Texture('data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="#ff4500" opacity="0.9"/>
        <circle cx="16" cy="16" r="8" fill="#ff6600" opacity="0.7"/>
        <circle cx="16" cy="16" r="4" fill="#ffaa00" opacity="0.5"/>
      </svg>
    `), this.scene);

    this.particleSystem.emitter = new BABYLON.Vector3(0, 0, 0);
    this.particleSystem.minEmitBox = new BABYLON.Vector3(-4, 0, -2.5);
    this.particleSystem.maxEmitBox = new BABYLON.Vector3(4, 0.1, 2.5);

    this.particleSystem.color1 = new BABYLON.Color4(1, 0.3, 0, 0.8);
    this.particleSystem.color2 = new BABYLON.Color4(0.6, 0.1, 0, 0.6);
    this.particleSystem.colorDead = new BABYLON.Color4(0.2, 0.05, 0, 0);

    this.particleSystem.minSize = 0.04;
    this.particleSystem.maxSize = 0.12;
    this.particleSystem.minLifeTime = 1.5;
    this.particleSystem.maxLifeTime = 4;
    this.particleSystem.emitRate = 25;

    this.particleSystem.gravity = new BABYLON.Vector3(0, -1, 0);
    this.particleSystem.direction1 = new BABYLON.Vector3(-0.5, 1, -0.5);
    this.particleSystem.direction2 = new BABYLON.Vector3(0.5, 2, 0.5);

    this.particleSystem.minEmitPower = 0.5;
    this.particleSystem.maxEmitPower = 2;

    this.particleSystem.start();
    console.log('🌋 Lava particles enabled');
  }

  private createGenericParticles(): void {
    if (!this.particleSystem) return;

    this.particleSystem.particleTexture = new BABYLON.Texture('data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="10" fill="white" opacity="0.6"/>
      </svg>
    `), this.scene);

    this.particleSystem.emitter = new BABYLON.Vector3(0, 0, 0);
    this.particleSystem.minEmitBox = new BABYLON.Vector3(-5, 0, -3);
    this.particleSystem.maxEmitBox = new BABYLON.Vector3(5, 0, 3);

    this.particleSystem.color1 = new BABYLON.Color4(
      this.theme.colors.ball.r, 
      this.theme.colors.ball.g, 
      this.theme.colors.ball.b, 
      0.5
    );
    this.particleSystem.color2 = new BABYLON.Color4(
      this.theme.colors.borders.r, 
      this.theme.colors.borders.g, 
      this.theme.colors.borders.b, 
      0.3
    );

    this.particleSystem.minSize = 0.05;
    this.particleSystem.maxSize = 0.15;
    this.particleSystem.emitRate = 30;

    this.particleSystem.start();
  }

  enableGlow(meshes: BABYLON.Mesh[]): void {
    if (this.glowLayer) {
      this.glowLayer.dispose();
    }

    this.glowLayer = new BABYLON.GlowLayer('glow', this.scene);
    
    // Adapter l'intensité selon le thème
    switch (this.theme.id) {
      case 'lava':
        this.glowLayer.intensity = 0.8;
        break;
      case 'matrix':
        this.glowLayer.intensity = 0.6;
        break;
      case 'italian':
        this.glowLayer.intensity = 0.3; // Lueur douce
        break;
      default:
        this.glowLayer.intensity = 0.5;
    }

    meshes.forEach(mesh => {
      this.glowLayer!.addIncludedOnlyMesh(mesh);
    });

    console.log(`✨ Glow effect enabled for ${this.theme.name} theme`);
  }

  // Méthode pour les effets spéciaux de thème
  enableThemeSpecificEffects(): void {
    switch (this.theme.id) {
      case 'matrix':
        this.enableMatrixRain();
        break;
      case 'lava':
        this.enableFieldAnimation();
        break;
      case 'italian':
        this.createSteamEffect();
        console.log('🍕 Italian kitchen atmosphere enabled');
        break;
    }
  }

  private enableMatrixRain(): void {
    // Créer un effet de pluie de code Matrix simple
    console.log('🌧️ Matrix rain effect enabled');
    // TODO: Implémenter la pluie de code avec des textures
  }

  private enableFieldAnimation(): void {
    if (this.beforeRenderObserver) {
      this.scene.onBeforeRenderObservable.remove(this.beforeRenderObserver);
    }

    // Animation du terrain de lave qui bouillonne
    this.beforeRenderObserver = this.scene.onBeforeRenderObservable.add(() => {
      this.fieldAnimationTimer += 0.02;
      
      // Trouver le terrain et animer sa position Y légèrement
      const field = this.scene.getMeshByName('field');
      if (field) {
        field.position.y = 0.005 * Math.sin(this.fieldAnimationTimer * 2);
      }
    });

    console.log('🌋 Lava field animation enabled');
  }

  dispose(): void {
    if (this.trailSystem) {
      this.trailSystem.dispose();
      this.trailSystem = null;
    }

    if (this.particleSystem) {
      this.particleSystem.dispose();
      this.particleSystem = null;
    }

    if (this.glowLayer) {
      this.glowLayer.dispose();
      this.glowLayer = null;
    }

    if (this.beforeRenderObserver) {
      this.scene.onBeforeRenderObservable.remove(this.beforeRenderObserver);
      this.beforeRenderObserver = null;
    }

    console.log('🧹 Effects manager disposed');
  }
}