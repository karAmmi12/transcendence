export interface BrowserFeature {
  name: string;
  test: () => boolean;
  fallback?: string;
  critical: boolean;
  category: 'core' | 'game' | 'ui' | 'nice-to-have';
}

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  mobile: boolean;
}

export interface CompatibilityResult {
  browserInfo: BrowserInfo;
  overallScore: number;
  categoryScores: {
    core: number;
    game: number;
    ui: number;
    'nice-to-have': number;
  };
  features: {
    [key: string]: {
      supported: boolean;
      critical: boolean;
      category: string;
      fallback?: string;
    };
  };
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export class BrowserCompatibilityTest {
  private features: BrowserFeature[] = [
    // ✅ CORE - Vraiment critiques pour l'application
    {
      name: 'ES6 Classes',
      test: () => {
        try {
          // Test plus sûr sans eval
          return typeof class {} === 'function';
        } catch {
          return false;
        }
      },
      critical: true,
      category: 'core',
      fallback: 'Babel transpilation required'
    },
    {
      name: 'Fetch API',
      test: () => typeof fetch !== 'undefined',
      critical: true,
      category: 'core',
      fallback: 'XMLHttpRequest polyfill'
    },
    {
      name: 'Promise',
      test: () => typeof Promise !== 'undefined',
      critical: true,
      category: 'core',
      fallback: 'Promise polyfill required'
    },
    {
      name: 'querySelector',
      test: () => typeof document.querySelector === 'function',
      critical: true,
      category: 'core',
      fallback: 'getElementById/getElementsByClassName'
    },
    {
      name: 'addEventListener',
      test: () => typeof document.addEventListener === 'function',
      critical: true,
      category: 'core',
      fallback: 'attachEvent for old IE'
    },

    // ✅ GAME - Critiques pour le jeu
    {
      name: 'Canvas 2D',
      test: () => {
        try {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext && canvas.getContext('2d'));
        } catch {
          return false;
        }
      },
      critical: true,
      category: 'game',
      fallback: 'Game cannot run without Canvas'
    },
    {
      name: 'WebSocket',
      test: () => typeof WebSocket !== 'undefined',
      critical: true,
      category: 'game',
      fallback: 'Long polling for real-time features'
    },

    // ✅ MODERN JS - Importantes mais pas critiques
    {
      name: 'Arrow Functions',
      test: () => {
        try {
          new Function('return () => {}')();
          return true;
        } catch {
          return false;
        }
      },
      critical: false,
      category: 'core',
      fallback: 'Function expressions'
    },
    {
      name: 'Template Literals',
      test: () => {
        try {
          new Function('return `test`')();
          return true;
        } catch {
          return false;
        }
      },
      critical: false,
      category: 'core',
      fallback: 'String concatenation'
    },
    {
      name: 'Async/Await',
      test: () => {
        try {
          new Function('return async function() {}')();
          return true;
        } catch {
          return false;
        }
      },
      critical: false,
      category: 'core',
      fallback: 'Promises with .then()'
    },
    {
      name: 'Map and Set',
      test: () => typeof Map !== 'undefined' && typeof Set !== 'undefined',
      critical: false,
      category: 'core',
      fallback: 'Objects and Arrays'
    },
    {
      name: 'Destructuring',
      test: () => {
        try {
          new Function('const [a] = [1]; const {b} = {b:2}; return a + b')();
          return true;
        } catch {
          return false;
        }
      },
      critical: false,
      category: 'core',
      fallback: 'Manual property access'
    },

    // ✅ DOM APIs - Utiles mais pas critiques
    {
      name: 'CustomEvent',
      test: () => typeof CustomEvent !== 'undefined',
      critical: false,
      category: 'ui',
      fallback: 'createEvent and initEvent'
    },
    {
      name: 'classList',
      test: () => {
        const div = document.createElement('div');
        return typeof div.classList !== 'undefined';
      },
      critical: false,
      category: 'ui',
      fallback: 'className manipulation'
    },
    {
      name: 'FormData',
      test: () => typeof FormData !== 'undefined',
      critical: false,
      category: 'ui',
      fallback: 'Manual form serialization'
    },

    // ✅ STORAGE - Utiles mais pas critiques
    {
      name: 'localStorage',
      test: () => {
        try {
          return typeof localStorage !== 'undefined' &&
                 typeof localStorage.setItem === 'function' &&
                 typeof localStorage.getItem === 'function';
        } catch {
          return false;
        }
      },
      critical: false,
      category: 'nice-to-have',
      fallback: 'Session cookies'
    },
    {
      name: 'sessionStorage',
      test: () => {
        try {
          return typeof sessionStorage !== 'undefined' &&
                 typeof sessionStorage.setItem === 'function' &&
                 typeof sessionStorage.getItem === 'function';
        } catch {
          return false;
        }
      },
      critical: false,
      category: 'nice-to-have',
      fallback: 'Memory variables'
    },

    // ✅ ADVANCED GAME FEATURES
    {
      name: 'WebGL',
      test: () => {
        try {
          const canvas = document.createElement('canvas');
          return !!(
            canvas.getContext('webgl') || 
            canvas.getContext('experimental-webgl') ||
            canvas.getContext('webgl2')
          );
        } catch {
          return false;
        }
      },
      critical: false,
      category: 'game',
      fallback: '2D Canvas (reduced visual effects)'
    },
    {
      name: 'Web Audio API',
      test: () => typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined',
      critical: false,
      category: 'game',
      fallback: 'HTML5 Audio element'
    },
    {
      name: 'HTML5 Audio',
      test: () => {
        try {
          const audio = document.createElement('audio');
          return !!(audio.canPlayType);
        } catch {
          return false;
        }
      },
      critical: false,
      category: 'game',
      fallback: 'Silent gameplay'
    },

    // ✅ FILE API - Pour upload avatar
    {
      name: 'File API',
      test: () => typeof File !== 'undefined' && 
                   typeof FileReader !== 'undefined' && 
                   typeof Blob !== 'undefined',
      critical: false,
      category: 'ui',
      fallback: 'Server-side file handling only'
    },

    // ✅ CSS FEATURES
    {
      name: 'CSS Flexbox',
      test: () => {
        try {
          return CSS.supports('display', 'flex');
        } catch {
          return false;
        }
      },
      critical: false,
      category: 'ui',
      fallback: 'Float layouts'
    },
    {
      name: 'CSS Grid',
      test: () => {
        try {
          return CSS.supports('display', 'grid');
        } catch {
          return false;
        }
      },
      critical: false,
      category: 'ui',
      fallback: 'Flexbox layouts'
    },
    {
      name: 'CSS Custom Properties',
      test: () => {
        try {
          return CSS.supports('--test', 'value');
        } catch {
          return false;
        }
      },
      critical: false,
      category: 'ui',
      fallback: 'Static CSS values'
    },
    {
      name: 'CSS Transforms',
      test: () => {
        try {
          return CSS.supports('transform', 'translateX(0)');
        } catch {
          return false;
        }
      },
      critical: false,
      category: 'ui',
      fallback: 'JavaScript animations'
    },

    // ✅ MODERN OBSERVERS
    {
      name: 'Intersection Observer',
      test: () => typeof IntersectionObserver !== 'undefined',
      critical: false,
      category: 'nice-to-have',
      fallback: 'Scroll event listeners'
    },
    {
      name: 'Resize Observer',
      test: () => typeof ResizeObserver !== 'undefined',
      critical: false,
      category: 'nice-to-have',
      fallback: 'Window resize events'
    },

    // ✅ PERFORMANCE APIs
    {
      name: 'requestAnimationFrame',
      test: () => typeof requestAnimationFrame !== 'undefined',
      critical: false,
      category: 'game',
      fallback: 'setTimeout for animations'
    },
    {
      name: 'Performance API',
      test: () => typeof performance !== 'undefined' && 
                   typeof performance.now === 'function',
      critical: false,
      category: 'nice-to-have',
      fallback: 'Date.now() for timing'
    }
  ];

  public runCompatibilityTest(): CompatibilityResult {
    const browserInfo = this.detectBrowser();
    const featureResults: { [key: string]: any } = {};
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];

    let supportedFeatures = 0;
    let criticalFeatures = 0;
    let supportedCriticalFeatures = 0;

    // Scores par catégorie
    const categoryStats = {
      core: { total: 0, supported: 0 },
      game: { total: 0, supported: 0 },
      ui: { total: 0, supported: 0 },
      'nice-to-have': { total: 0, supported: 0 }
    };

    // Test each feature
    for (const feature of this.features) {
      const supported = feature.test();
      
      featureResults[feature.name] = {
        supported,
        critical: feature.critical,
        category: feature.category,
        fallback: feature.fallback
      };

      // Stats globales
      if (supported) {
        supportedFeatures++;
      }

      // Stats par catégorie
      categoryStats[feature.category].total++;
      if (supported) {
        categoryStats[feature.category].supported++;
      }

      // Gestion des features critiques
      if (feature.critical) {
        criticalFeatures++;
        if (supported) {
          supportedCriticalFeatures++;
        } else {
          errors.push(`Critical feature "${feature.name}" is not supported`);
          if (feature.fallback) {
            recommendations.push(`Use fallback for ${feature.name}: ${feature.fallback}`);
          }
        }
      } else if (!supported) {
        const severity = feature.category === 'core' ? 'Important' : 'Optional';
        warnings.push(`${severity} feature "${feature.name}" is not supported`);
        if (feature.fallback) {
          recommendations.push(`Consider fallback for ${feature.name}: ${feature.fallback}`);
        }
      }
    }

    // Calculate scores
    const totalFeatures = this.features.length;
    const basicScore = (supportedFeatures / totalFeatures) * 100;
    
    // Pénalité plus douce pour les features critiques
    const criticalPenalty = criticalFeatures > 0 ? 
      ((criticalFeatures - supportedCriticalFeatures) / criticalFeatures) * 30 : 0;
    
    const overallScore = Math.max(20, basicScore - criticalPenalty); // Score minimum de 20

    // Category scores
    const categoryScores = {
      core: categoryStats.core.total > 0 ? 
        Math.round((categoryStats.core.supported / categoryStats.core.total) * 100) : 100,
      game: categoryStats.game.total > 0 ? 
        Math.round((categoryStats.game.supported / categoryStats.game.total) * 100) : 100,
      ui: categoryStats.ui.total > 0 ? 
        Math.round((categoryStats.ui.supported / categoryStats.ui.total) * 100) : 100,
      'nice-to-have': categoryStats['nice-to-have'].total > 0 ? 
        Math.round((categoryStats['nice-to-have'].supported / categoryStats['nice-to-have'].total) * 100) : 100
    };

    // Add browser-specific recommendations
    this.addBrowserSpecificRecommendations(browserInfo, recommendations, warnings);

    return {
      browserInfo,
      overallScore: Math.round(overallScore),
      categoryScores,
      features: featureResults,
      warnings,
      errors,
      recommendations
    };
  }

  private detectBrowser(): BrowserInfo {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    let name = 'Unknown';
    let version = 'Unknown';
    let engine = 'Unknown';

    // Detection améliorée
    if (userAgent.includes('Edg/')) {
      name = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    } else if (userAgent.includes('Chrome')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Gecko';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'WebKit';
    } else if (userAgent.includes('Trident') || userAgent.includes('MSIE')) {
      name = 'Internet Explorer';
      const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Trident';
    }

    const mobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

    return {
      name,
      version,
      engine,
      platform,
      mobile
    };
  }

  private addBrowserSpecificRecommendations(
    browserInfo: BrowserInfo, 
    recommendations: string[], 
    warnings: string[]
  ): void {
    const version = parseInt(browserInfo.version);

    switch (browserInfo.name) {
      case 'Internet Explorer':
        recommendations.push('⚠️ IE is not supported. Please use Chrome, Firefox, or Edge');
        break;

      case 'Chrome':
        if (version < 70) {
          warnings.push('Chrome version is quite old. Consider updating');
        }
        if (version >= 90) {
          recommendations.push('✅ Excellent browser choice for this application');
        }
        break;

      case 'Firefox':
        if (version < 65) {
          warnings.push('Firefox version is outdated. Consider updating');
        }
        if (version >= 80) {
          recommendations.push('✅ Great browser choice for gaming');
        }
        break;

      case 'Safari':
        if (version < 12) {
          warnings.push('Safari version may have compatibility issues');
        }
        recommendations.push('Safari works well but Chrome/Firefox recommended for best experience');
        break;

      case 'Edge':
        if (version >= 80) {
          recommendations.push('✅ Modern Edge works perfectly');
        }
        break;
    }

    if (browserInfo.mobile) {
      recommendations.push('📱 Mobile detected: Touch controls available');
      recommendations.push('🔄 Rotate device to landscape for better gaming experience');
    }
  }

  public generateCompatibilityReport(result: CompatibilityResult): string {
    let report = `
🌐 BROWSER COMPATIBILITY REPORT
===============================

📱 Browser Information:
  Name: ${result.browserInfo.name}
  Version: ${result.browserInfo.version}
  Engine: ${result.browserInfo.engine}
  Platform: ${result.browserInfo.platform}
  Mobile: ${result.browserInfo.mobile ? 'Yes' : 'No'}

📊 Compatibility Scores:
  Overall: ${result.overallScore}/100
  Core Features: ${result.categoryScores.core}/100
  Game Features: ${result.categoryScores.game}/100
  UI Features: ${result.categoryScores.ui}/100
  Nice-to-Have: ${result.categoryScores['nice-to-have']}/100

`;

    // Interprétation du score
    if (result.overallScore >= 85) {
      report += '✅ EXCELLENT - Perfect compatibility\n';
    } else if (result.overallScore >= 70) {
      report += '✅ GOOD - Great compatibility with minor limitations\n';
    } else if (result.overallScore >= 55) {
      report += '⚠️  FAIR - Functional but some features limited\n';
    } else if (result.overallScore >= 40) {
      report += '⚠️  POOR - Basic functionality only\n';
    } else {
      report += '❌ CRITICAL - Major compatibility issues\n';
    }

    // Features par catégorie
    const categories = ['core', 'game', 'ui', 'nice-to-have'];
    categories.forEach(category => {
      const categoryFeatures = Object.entries(result.features)
        .filter(([_, feature]) => feature.category === category);
      
      if (categoryFeatures.length > 0) {
        report += `\n🔧 ${category.toUpperCase()} Features:\n`;
        categoryFeatures.forEach(([name, feature]) => {
          const status = feature.supported ? '✅' : '❌';
          const critical = feature.critical ? ' (Critical)' : '';
          report += `  ${status} ${name}${critical}\n`;
        });
      }
    });

    // Rest of the report...
    if (result.errors.length > 0) {
      report += '\n❌ Critical Issues:\n';
      result.errors.forEach(error => {
        report += `  • ${error}\n`;
      });
    }

    if (result.warnings.length > 0) {
      report += '\n⚠️  Warnings:\n';
      result.warnings.forEach(warning => {
        report += `  • ${warning}\n`;
      });
    }

    if (result.recommendations.length > 0) {
      report += '\n💡 Recommendations:\n';
      result.recommendations.forEach(rec => {
        report += `  • ${rec}\n`;
      });
    }

    return report;
  }

  public showCompatibilityModal(result: CompatibilityResult): void {
    const modal = document.createElement('div');
    modal.id = 'browser-compatibility-modal';
    modal.className = 'fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4';
    
    const scoreColor = result.overallScore >= 70 ? 'text-green-400' : 
                      result.overallScore >= 55 ? 'text-yellow-400' : 'text-red-400';
    
    const scoreIcon = result.overallScore >= 70 ? '✅' : 
                      result.overallScore >= 55 ? '⚠️' : '❌';

    modal.innerHTML = `
      <div class="bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <!-- Header -->
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-white flex items-center">
              🌐 Browser Compatibility Report
            </h2>
            <button id="close-compatibility-modal" class="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Browser Info & Scores -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-gray-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-white mb-2">Browser Info</h3>
              <div class="space-y-1 text-sm text-gray-300">
                <div><strong>Name:</strong> ${result.browserInfo.name}</div>
                <div><strong>Version:</strong> ${result.browserInfo.version}</div>
                <div><strong>Engine:</strong> ${result.browserInfo.engine}</div>
                <div><strong>Platform:</strong> ${result.browserInfo.platform}</div>
                <div><strong>Mobile:</strong> ${result.browserInfo.mobile ? 'Yes' : 'No'}</div>
              </div>
            </div>
            
            <div class="bg-gray-700 rounded-lg p-4 text-center">
              <h3 class="text-lg font-semibold text-white mb-2">Overall Score</h3>
              <div class="text-4xl ${scoreColor} mb-2">${scoreIcon}</div>
              <div class="text-3xl font-bold ${scoreColor}">${result.overallScore}/100</div>
            </div>

            <div class="bg-gray-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-white mb-2">Category Scores</h3>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-300">Core:</span>
                  <span class="text-white font-bold">${result.categoryScores.core}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">Game:</span>
                  <span class="text-white font-bold">${result.categoryScores.game}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">UI:</span>
                  <span class="text-white font-bold">${result.categoryScores.ui}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">Nice-to-have:</span>
                  <span class="text-white font-bold">${result.categoryScores['nice-to-have']}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Features par catégorie -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-white mb-4">Feature Support by Category</h3>
            
            ${['core', 'game', 'ui', 'nice-to-have'].map(category => {
              const categoryFeatures = Object.entries(result.features)
                .filter(([_, feature]) => feature.category === category);
              
              if (categoryFeatures.length === 0) return '';
              
              return `
                <div class="mb-4">
                  <h4 class="text-md font-medium text-gray-300 mb-2 capitalize">${category.replace('-', ' ')} Features</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    ${categoryFeatures.map(([name, feature]) => `
                      <div class="flex items-center space-x-2 p-2 bg-gray-700 rounded">
                        <span class="text-lg">${feature.supported ? '✅' : '❌'}</span>
                        <span class="text-sm text-gray-300 flex-1">${name}</span>
                        ${feature.critical ? '<span class="text-xs bg-red-600 text-white px-1 rounded">Critical</span>' : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Errors, Warnings, Recommendations -->
          ${result.errors.length > 0 ? `
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-red-400 mb-2">❌ Critical Issues</h3>
              <div class="space-y-1">
                ${result.errors.map(error => `
                  <div class="text-sm text-red-300 bg-red-900 bg-opacity-30 p-2 rounded">• ${error}</div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${result.warnings.length > 0 ? `
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-yellow-400 mb-2">⚠️ Warnings</h3>
              <div class="space-y-1">
                ${result.warnings.map(warning => `
                  <div class="text-sm text-yellow-300 bg-yellow-900 bg-opacity-30 p-2 rounded">• ${warning}</div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${result.recommendations.length > 0 ? `
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-blue-400 mb-2">💡 Recommendations</h3>
              <div class="space-y-1">
                ${result.recommendations.map(rec => `
                  <div class="text-sm text-blue-300 bg-blue-900 bg-opacity-30 p-2 rounded">• ${rec}</div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button id="copy-report" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              📋 Copy Report
            </button>
            <button id="close-modal-btn" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Events
    const closeBtn = modal.querySelector('#close-compatibility-modal');
    const closeBtnBottom = modal.querySelector('#close-modal-btn');
    const copyBtn = modal.querySelector('#copy-report');

    [closeBtn, closeBtnBottom].forEach(btn => {
      btn?.addEventListener('click', () => {
        modal.remove();
      });
    });

    copyBtn?.addEventListener('click', () => {
      const report = this.generateCompatibilityReport(result);
      navigator.clipboard.writeText(report).then(() => {
        (copyBtn as HTMLElement).textContent = '✅ Copied!';
        setTimeout(() => {
          (copyBtn as HTMLElement).textContent = '📋 Copy Report';
        }, 2000);
      });
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
}