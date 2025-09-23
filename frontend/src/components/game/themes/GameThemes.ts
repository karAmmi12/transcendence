import * as BABYLON from '@babylonjs/core';
import type { ThemeConfig } from '@/types/index.js';

export class GameThemes
{
  // ==========================================
  // PROPRIÉTÉS PRIVÉES STATIQUES
  // ==========================================

  private static themes: Map<string, ThemeConfig> = new Map();

  // ==========================================
  // MÉTHODES PUBLIQUES STATIQUES
  // ==========================================

  /**
   * Initialise tous les thèmes disponibles
   */
  static initialize(): void
  {
    this.themes.set('classic', this.createClassicTheme());
    this.themes.set('retro', this.createRetroTheme());
    this.themes.set('space', this.createSpaceTheme());
    this.themes.set('italian', this.createItalianTheme());
    this.themes.set('matrix', this.createMatrixTheme());
    this.themes.set('lava', this.createLavaTheme());
  }

  /**
   * Récupère un thème par son identifiant
   * @param id Identifiant du thème
   * @returns Configuration du thème ou null si non trouvé
   */
  static getTheme(id: string): ThemeConfig | null
  {
    return this.themes.get(id) || null;
  }

  /**
   * Récupère tous les thèmes disponibles
   * @returns Liste de tous les thèmes
   */
  static getAllThemes(): ThemeConfig[]
  {
    return Array.from(this.themes.values());
  }

  // ==========================================
  // MÉTHODES PRIVÉES DE CRÉATION DES THÈMES
  // ==========================================

  // ==========================================
  // THÈMES CLASSIQUES ET SIMPLES
  // ==========================================

  /**
   * Crée le thème classique Pong
   */
  private static createClassicTheme(): ThemeConfig
  {
    return {
      id: 'classic',
      name: 'Classic',
      description: 'Le thème Pong classique avec des couleurs simples',
      colors: {
        field: new BABYLON.Color3(0.1, 0.3, 0.1),
        ball: new BABYLON.Color3(1, 1, 0.2),
        player1Paddle: new BABYLON.Color3(0.2, 0.6, 1),
        player2Paddle: new BABYLON.Color3(1, 0.2, 0.2),
        borders: new BABYLON.Color3(0.2, 0.6, 1),
        centerLine: new BABYLON.Color3(1, 1, 1),
        background: new BABYLON.Color4(0.1, 0.1, 0.2, 1)
      },
      materials: {
        field: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(0.1, 0.3, 0.1),
            specularColor: new BABYLON.Color3(0.2, 0.5, 0.2)
          }
        },
        ball: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(1, 1, 0.2),
            specularColor: new BABYLON.Color3(1, 1, 1)
          }
        },
        paddles: {
          type: 'standard',
          properties: {
            specularColor: new BABYLON.Color3(0.8, 0.8, 0.8)
          }
        },
        borders: {
          type: 'emissive',
          properties: {
            emissiveColor: new BABYLON.Color3(0.2, 0.6, 1)
          }
        }
      },
      lighting: {
        ambient: 0.6,
        directional: 0.8,
        shadowsEnabled: false
      },
      effects: {
        ballTrail: false,
        particles: false,
        glow: false
      }
    };
  }

  // ==========================================
  // THÈMES FUTURISTES ET LUMINEUX
  // ==========================================

  
  /**
   * Crée le thème rétro arcade
   */
  private static createRetroTheme(): ThemeConfig
  {
    return {
      id: 'retro',
      name: 'Retro',
      description: 'Style arcade vintage des années 80',
      colors: {
        field: new BABYLON.Color3(0.15, 0.05, 0.2),
        ball: new BABYLON.Color3(1, 0.8, 0),
        player1Paddle: new BABYLON.Color3(1, 0.4, 0.8),
        player2Paddle: new BABYLON.Color3(0.4, 1, 0.8),
        borders: new BABYLON.Color3(1, 0.6, 0),
        centerLine: new BABYLON.Color3(1, 1, 0.6),
        background: new BABYLON.Color4(0.1, 0.02, 0.15, 1)
      },
      materials: {
        field: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(0.15, 0.05, 0.2)
          }
        },
        ball: {
          type: 'emissive',
          properties: {
            emissiveColor: new BABYLON.Color3(1, 0.8, 0),
            diffuseColor: new BABYLON.Color3(0.8, 0.6, 0)
          }
        },
        paddles: {
          type: 'emissive',
          properties: {
            specularColor: new BABYLON.Color3(0.8, 0.8, 0.8)
          }
        },
        borders: {
          type: 'emissive',
          properties: {
            emissiveColor: new BABYLON.Color3(1, 0.6, 0)
          }
        }
      },
      lighting: {
        ambient: 0.4,
        directional: 0.6,
        shadowsEnabled: false
      },
      effects: {
        ballTrail: true,
        particles: false,
        glow: true
      }
    };
  }

  // ==========================================
  // THÈMES TECHNIQUES ET SOMBRES
  // ==========================================


  /**
   * Crée le thème Matrix avec code vert
   */
  private static createMatrixTheme(): ThemeConfig
  {
    return {
      id: 'matrix',
      name: 'Matrix Code',
      description: 'Monde digital avec code vert et effets de glitch',
      colors: {
        field: new BABYLON.Color3(0.02, 0.02, 0.02),
        ball: new BABYLON.Color3(0, 1, 0.2),
        player1Paddle: new BABYLON.Color3(0, 0.8, 0),
        player2Paddle: new BABYLON.Color3(0, 0.8, 0),
        borders: new BABYLON.Color3(0, 1, 0.3),
        centerLine: new BABYLON.Color3(0, 0.6, 0),
        background: new BABYLON.Color4(0.01, 0.01, 0.01, 1)
      },
      materials: {
        field: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(0.02, 0.02, 0.02),
            emissiveColor: new BABYLON.Color3(0, 0.1, 0),
            transparency: 0.7
          }
        },
        ball: {
          type: 'emissive',
          properties: {
            emissiveColor: new BABYLON.Color3(0, 1, 0.2),
            diffuseColor: new BABYLON.Color3(0, 0.5, 0.1)
          }
        },
        paddles: {
          type: 'emissive',
          properties: {
            emissiveColor: new BABYLON.Color3(0, 0.8, 0),
            diffuseColor: new BABYLON.Color3(0, 0.4, 0)
          }
        },
        borders: {
          type: 'emissive',
          properties: {
            emissiveColor: new BABYLON.Color3(0, 1, 0.3)
          }
        }
      },
      lighting: {
        ambient: 0.2,
        directional: 0.3,
        shadowsEnabled: false
      },
      effects: {
        ballTrail: true,
        particles: false,
        glow: true,
        matrixRain: true,
        glitch: true,
        fieldAnimation: true
      }
    };
  }

  // ==========================================
  // THÈMES SPÉCIALISÉS ET THÉMATIQUES
  // ==========================================

  /**
   * Crée le thème spatial avec étoiles
   */
  private static createSpaceTheme(): ThemeConfig
  {
    return {
      id: 'space',
      name: 'Space',
      description: 'Thème spatial avec des étoiles',
      colors: {
        field: new BABYLON.Color3(0.02, 0.02, 0.08),
        ball: new BABYLON.Color3(1, 1, 1),
        player1Paddle: new BABYLON.Color3(0.2, 0.4, 1),
        player2Paddle: new BABYLON.Color3(1, 0.4, 0.2),
        borders: new BABYLON.Color3(0.5, 0.5, 1),
        centerLine: new BABYLON.Color3(0.8, 0.8, 1),
        background: new BABYLON.Color4(0.01, 0.01, 0.05, 1)
      },
      materials: {
        field: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(0.02, 0.02, 0.08),
            specularColor: new BABYLON.Color3(0.1, 0.1, 0.2)
          }
        },
        ball: {
          type: 'emissive',
          properties: {
            emissiveColor: new BABYLON.Color3(1, 1, 1),
            diffuseColor: new BABYLON.Color3(0.8, 0.8, 0.8)
          }
        },
        paddles: {
          type: 'standard',
          properties: {
            specularColor: new BABYLON.Color3(1, 1, 1)
          }
        },
        borders: {
          type: 'emissive',
          properties: {
            emissiveColor: new BABYLON.Color3(0.5, 0.5, 1)
          }
        }
      },
      lighting: {
        ambient: 0.3,
        directional: 0.7,
        shadowsEnabled: false
      },
      effects: {
        ballTrail: true,
        particles: true,
        glow: false
      }
    };
  }

  /**
   * Crée le thème italien avec cuisine
   */
  private static createItalianTheme(): ThemeConfig
  {
    return {
      id: 'italian',
      name: 'Cuisine Italienne',
      description: 'Ambiance de restaurant italien avec table en bois et spatules',
      colors: {
        field: new BABYLON.Color3(0.45, 0.3, 0.2),
        ball: new BABYLON.Color3(0.98, 0.95, 0.88),
        player1Paddle: new BABYLON.Color3(0.8, 0.6, 0.4),
        player2Paddle: new BABYLON.Color3(0.7, 0.5, 0.3),
        borders: new BABYLON.Color3(0.6, 0.4, 0.25),
        centerLine: new BABYLON.Color3(0.95, 0.92, 0.85),
        background: new BABYLON.Color4(0.25, 0.18, 0.12, 1)
      },
      materials: {
        field: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(0.45, 0.3, 0.2),
            specularColor: new BABYLON.Color3(0.3, 0.2, 0.1),
            emissiveColor: new BABYLON.Color3(0.05, 0.03, 0.02)
          }
        },
        ball: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(0.98, 0.95, 0.88),
            specularColor: new BABYLON.Color3(0.4, 0.4, 0.35),
            emissiveColor: new BABYLON.Color3(0.02, 0.02, 0.01),
            transparency: 0.08
          }
        },
        paddles: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(0.75, 0.55, 0.35),
            specularColor: new BABYLON.Color3(0.25, 0.18, 0.12),
            emissiveColor: new BABYLON.Color3(0.03, 0.02, 0.01)
          }
        },
        borders: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(0.6, 0.4, 0.25),
            specularColor: new BABYLON.Color3(0.2, 0.15, 0.1),
            emissiveColor: new BABYLON.Color3(0.02, 0.015, 0.01)
          }
        }
      },
      lighting: {
        ambient: 0.8,
        directional: 0.7,
        shadowsEnabled: false
      },
      effects: {
        ballTrail: true,
        particles: true,
        glow: false,
        ballStretch: true,
        fieldAnimation: false,
        steamEffect: true
      },
      textures: {
        field: 'wood_table',
        ball: 'mozzarella_stretch',
        paddles: 'wooden_spatula'
      }
    };
  }

  /**
   * Crée le thème volcanique avec lave
   */
  private static createLavaTheme(): ThemeConfig
  {
    return {
      id: 'lava',
      name: 'Temple de Lave',
      description: 'Temple volcanique avec lave bouillonnante et particules de feu',
      colors: {
        field: new BABYLON.Color3(0.2, 0.05, 0.02),
        ball: new BABYLON.Color3(1, 0.3, 0),
        player1Paddle: new BABYLON.Color3(0.3, 0.15, 0.1),
        player2Paddle: new BABYLON.Color3(0.3, 0.15, 0.1),
        borders: new BABYLON.Color3(0.6, 0.2, 0.1),
        centerLine: new BABYLON.Color3(1, 0.4, 0.1),
        background: new BABYLON.Color4(0.15, 0.05, 0.02, 1)
      },
      materials: {
        field: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(0.2, 0.05, 0.02),
            emissiveColor: new BABYLON.Color3(0.1, 0.02, 0),
            specularColor: new BABYLON.Color3(0.1, 0.05, 0.02)
          }
        },
        ball: {
          type: 'emissive',
          properties: {
            emissiveColor: new BABYLON.Color3(1, 0.3, 0),
            diffuseColor: new BABYLON.Color3(0.8, 0.2, 0)
          }
        },
        paddles: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(0.3, 0.15, 0.1),
            emissiveColor: new BABYLON.Color3(0.05, 0.01, 0),
            specularColor: new BABYLON.Color3(0.1, 0.05, 0.02)
          }
        },
        borders: {
          type: 'emissive',
          properties: {
            emissiveColor: new BABYLON.Color3(0.6, 0.2, 0.1),
            diffuseColor: new BABYLON.Color3(0.4, 0.1, 0.05)
          }
        }
      },
      lighting: {
        ambient: 0.3,
        directional: 0.5,
        shadowsEnabled: false
      },
      effects: {
        ballTrail: true,
        particles: true,
        glow: true,
        fieldAnimation: true
      },
      textures: {
        field: 'volcanic',
        ball: 'fire',
        paddles: 'stone'
      }
    };
  }
}