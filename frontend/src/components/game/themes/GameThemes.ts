import * as BABYLON from '@babylonjs/core';
import type { ThemeConfig } from '@/types/index.js';

export class GameThemes {
  private static themes: Map<string, ThemeConfig> = new Map();

  static initialize(): void {
    this.themes.set('classic', this.createClassicTheme());
    this.themes.set('neon', this.createNeonTheme());
    this.themes.set('retro', this.createRetroTheme());
    this.themes.set('cyberpunk', this.createCyberpunkTheme());
    this.themes.set('space', this.createSpaceTheme());
    this.themes.set('italian', this.createItalianTheme());
    this.themes.set('matrix', this.createMatrixTheme());
    this.themes.set('lava', this.createLavaTheme());
  }

  static getTheme(id: string): ThemeConfig | null {
    return this.themes.get(id) || null;
  }

  static getAllThemes(): ThemeConfig[] {
    return Array.from(this.themes.values());
  }

  private static createClassicTheme(): ThemeConfig {
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

  private static createNeonTheme(): ThemeConfig {
    return {
      id: 'neon',
      name: 'Neon',
      description: 'Thème futuriste avec des effets lumineux',
      colors: {
        field: new BABYLON.Color3(0.05, 0.05, 0.15),
        ball: new BABYLON.Color3(0, 1, 1),
        player1Paddle: new BABYLON.Color3(1, 0, 1),
        player2Paddle: new BABYLON.Color3(0, 1, 0),
        borders: new BABYLON.Color3(0, 1, 1),
        centerLine: new BABYLON.Color3(1, 0, 1),
        background: new BABYLON.Color4(0.02, 0.02, 0.1, 1)
      },
      materials: {
        field: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(0.05, 0.05, 0.15),
            specularColor: new BABYLON.Color3(0.1, 0.1, 0.3)
          }
        },
        ball: {
          type: 'emissive',
          properties: {
            emissiveColor: new BABYLON.Color3(0, 1, 1),
            diffuseColor: new BABYLON.Color3(0, 0.5, 0.5)
          }
        },
        paddles: {
          type: 'emissive',
          properties: {
            specularColor: new BABYLON.Color3(1, 1, 1)
          }
        },
        borders: {
          type: 'emissive',
          properties: {
            emissiveColor: new BABYLON.Color3(0, 1, 1)
          }
        }
      },
      lighting: {
        ambient: 0.3,
        directional: 0.4,
        shadowsEnabled: false
      },
      effects: {
        ballTrail: true,
        particles: true,
        glow: true
      }
    };
  }

  private static createRetroTheme(): ThemeConfig {
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

  private static createCyberpunkTheme(): ThemeConfig {
    return {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      description: 'Thème sombre et technologique',
      colors: {
        field: new BABYLON.Color3(0.1, 0.02, 0.02),
        ball: new BABYLON.Color3(1, 0.1, 0.3),
        player1Paddle: new BABYLON.Color3(0.8, 0, 0.8),
        player2Paddle: new BABYLON.Color3(0, 0.8, 0.8),
        borders: new BABYLON.Color3(1, 0.2, 0.2),
        centerLine: new BABYLON.Color3(0.8, 0.8, 0.8),
        background: new BABYLON.Color4(0.05, 0.01, 0.01, 1)
      },
      materials: {
        field: {
          type: 'pbr',
          properties: {
            diffuseColor: new BABYLON.Color3(0.1, 0.02, 0.02),
            metallic: 0.8,
            roughness: 0.3
          }
        },
        ball: {
          type: 'emissive',
          properties: {
            emissiveColor: new BABYLON.Color3(1, 0.1, 0.3),
            diffuseColor: new BABYLON.Color3(0.5, 0.05, 0.15)
          }
        },
        paddles: {
          type: 'pbr',
          properties: {
            metallic: 0.9,
            roughness: 0.1
          }
        },
        borders: {
          type: 'emissive',
          properties: {
            emissiveColor: new BABYLON.Color3(1, 0.2, 0.2)
          }
        }
      },
      lighting: {
        ambient: 0.2,
        directional: 0.5,
        shadowsEnabled: true
      },
      effects: {
        ballTrail: true,
        particles: true,
        glow: true
      }
    };
  }

  private static createSpaceTheme(): ThemeConfig {
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

  private static createItalianTheme(): ThemeConfig {
    return {
      id: 'italian',
      name: 'Cuisine Italienne',
      description: 'Ambiance de restaurant italien avec table en bois et spatules',
      colors: {
        field: new BABYLON.Color3(0.45, 0.3, 0.2), // Table en bois plus chaleureuse
        ball: new BABYLON.Color3(0.98, 0.95, 0.88), // Mozzarella plus réaliste
        player1Paddle: new BABYLON.Color3(0.8, 0.6, 0.4), // Spatule en bois clair
        player2Paddle: new BABYLON.Color3(0.7, 0.5, 0.3), // Spatule en bois foncé
        borders: new BABYLON.Color3(0.6, 0.4, 0.25), // Bordures en bois
        centerLine: new BABYLON.Color3(0.95, 0.92, 0.85), // Farine saupoudrée
        background: new BABYLON.Color4(0.25, 0.18, 0.12, 1) // Ambiance restaurant
      },
      materials: {
        field: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(0.45, 0.3, 0.2),
            specularColor: new BABYLON.Color3(0.3, 0.2, 0.1), // Reflet du bois
            emissiveColor: new BABYLON.Color3(0.05, 0.03, 0.02) // Chaleur subtile
          }
        },
        ball: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(0.98, 0.95, 0.88),
            specularColor: new BABYLON.Color3(0.4, 0.4, 0.35), // Brillance de la mozzarella
            emissiveColor: new BABYLON.Color3(0.02, 0.02, 0.01), // Lueur très douce
            transparency: 0.08 // Légère transparence pour l'effet mozzarella
          }
        },
        paddles: {
          type: 'standard',
          properties: {
            diffuseColor: new BABYLON.Color3(0.75, 0.55, 0.35),
            specularColor: new BABYLON.Color3(0.25, 0.18, 0.12), // Bois poli
            emissiveColor: new BABYLON.Color3(0.03, 0.02, 0.01) // Chaleur du bois
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
        ambient: 0.8, // Éclairage chaud et accueillant
        directional: 0.7, // Lumière douce
        shadowsEnabled: false
      },
      effects: {
        ballTrail: true, // Traînée de mozzarella qui s'étire
        particles: true, // Particules de farine et d'ingrédients
        glow: false,
        ballStretch: true, // Effet d'étirement de la mozzarella
        fieldAnimation: false,
        steamEffect: true // Vapeur de cuisine
      },
      textures: {
        field: 'wood_table',
        ball: 'mozzarella_stretch',
        paddles: 'wooden_spatula'
      }
    };
  }

  private static createMatrixTheme(): ThemeConfig {
    return {
      id: 'matrix',
      name: 'Matrix Code',
      description: 'Monde digital avec code vert et effets de glitch',
      colors: {
        field: new BABYLON.Color3(0.02, 0.02, 0.02), // Noir profond
        ball: new BABYLON.Color3(0, 1, 0.2), // Vert Matrix
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
            emissiveColor: new BABYLON.Color3(0, 0.1, 0), // Légère lueur verte
            transparency: 0.7 // Terrain semi-transparent
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
        ambient: 0.2, // Éclairage minimal
        directional: 0.3,
        shadowsEnabled: false
      },
      effects: {
        ballTrail: true,
        particles: false,
        glow: true,
        matrixRain: true, // Pluie de code
        glitch: true, // Effets de glitch subtils
        fieldAnimation: true // Wireframe animé
      }
    };
  }


   private static createLavaTheme(): ThemeConfig {
    return {
      id: 'lava',
      name: 'Temple de Lave',
      description: 'Temple volcanique avec lave bouillonnante et particules de feu',
      colors: {
        field: new BABYLON.Color3(0.2, 0.05, 0.02), // Pierre volcanique sombre
        ball: new BABYLON.Color3(1, 0.3, 0), // Boule de feu
        player1Paddle: new BABYLON.Color3(0.3, 0.15, 0.1), // Pierre volcanique
        player2Paddle: new BABYLON.Color3(0.3, 0.15, 0.1),
        borders: new BABYLON.Color3(0.6, 0.2, 0.1), // Bordures de lave
        centerLine: new BABYLON.Color3(1, 0.4, 0.1), // Fissure de lave
        background: new BABYLON.Color4(0.15, 0.05, 0.02, 1)
      },
      materials: {
        field: {
          type: 'standard', // ✅ Changé de PBR à standard
          properties: {
            diffuseColor: new BABYLON.Color3(0.2, 0.05, 0.02),
            emissiveColor: new BABYLON.Color3(0.1, 0.02, 0), // Légère lueur interne
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
          type: 'standard', // ✅ Changé de PBR à standard
          properties: {
            diffuseColor: new BABYLON.Color3(0.3, 0.15, 0.1),
            emissiveColor: new BABYLON.Color3(0.05, 0.01, 0), // Très légère lueur
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
        shadowsEnabled: false // ✅ Désactivé pour éviter les problèmes
      },
      effects: {
        ballTrail: true, // Traînée de feu
        particles: true, // Particules de cendres et étincelles
        glow: true,
        fieldAnimation: true // Lave qui bouillonne
      },
      textures: {
        field: 'volcanic',
        ball: 'fire',
        paddles: 'stone'
      }
    };
  }
}