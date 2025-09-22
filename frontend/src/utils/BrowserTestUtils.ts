// import { BrowserCompatibilityTest } from './BrowserCompatibilityTest';
// import { Logger } from '@/utils/logger.js'; 

// export class BrowserTestUtils {
//   private static testButton: HTMLElement | null = null;
//   private static compatibilityTest = new BrowserCompatibilityTest();

//   public static addCompatibilityTestButton(): void {
//     if (typeof import.meta.env !== 'undefined' && import.meta.env.PROD) return;

//     // Supprimer le bouton existant s'il y en a un
//     if (this.testButton) {
//       this.testButton.remove();
//     }

//     this.testButton = document.createElement('div');
//     this.testButton.className = 'fixed bottom-4 right-4 z-50 space-y-2';
//     this.testButton.innerHTML = `
//       <button id="browser-compatibility-btn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors block w-full">
//         🌐 Browser Test
//       </button>
//       <button id="quick-compatibility-btn" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors block w-full text-sm">
//         ⚡ Quick Check
//       </button>
//     `;

//     document.body.appendChild(this.testButton);

//     // Événements
//     document.getElementById('browser-compatibility-btn')?.addEventListener('click', () => {
//       this.runFullCompatibilityTest();
//     });

//     document.getElementById('quick-compatibility-btn')?.addEventListener('click', () => {
//       this.runQuickCompatibilityCheck();
//     });
//   }

//   private static runFullCompatibilityTest(): void {
//     Logger.log('🌐 Running full browser compatibility test...');
//     const result = this.compatibilityTest.runCompatibilityTest();
    
//     // Afficher le rapport dans la console
//     const report = this.compatibilityTest.generateCompatibilityReport(result);
//     Logger.log(report);
    
//     // Afficher le modal
//     this.compatibilityTest.showCompatibilityModal(result);
//   }

//   private static runQuickCompatibilityCheck(): void {
//     Logger.log('⚡ Running quick compatibility check...');
//     const result = this.compatibilityTest.runCompatibilityTest();
    
//     // Afficher une notification rapide
//     this.showQuickNotification(result);
//   }

//   private static showQuickNotification(result: any): void {
//     const notification = document.createElement('div');
//     notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
//       result.overallScore >= 75 ? 'bg-green-600' : 
//       result.overallScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
//     } text-white`;
    
//     const scoreIcon = result.overallScore >= 75 ? '✅' : 
//                       result.overallScore >= 60 ? '⚠️' : '❌';

//     notification.innerHTML = `
//       <div class="flex items-center space-x-2">
//         <span class="text-xl">${scoreIcon}</span>
//         <div>
//           <div class="font-semibold">${result.browserInfo.name} ${result.browserInfo.version}</div>
//           <div class="text-sm">Compatibility: ${result.overallScore}/100</div>
//           ${result.errors.length > 0 ? `<div class="text-xs mt-1">${result.errors.length} critical issues</div>` : ''}
//         </div>
//       </div>
//     `;

//     document.body.appendChild(notification);

//     // Animation d'apparition
//     setTimeout(() => {
//       notification.style.transform = 'translateX(0)';
//       notification.style.opacity = '1';
//     }, 10);

//     // Supprimer après 5 secondes
//     setTimeout(() => {
//       notification.style.transform = 'translateX(100%)';
//       notification.style.opacity = '0';
//       setTimeout(() => notification.remove(), 300);
//     }, 5000);
//   }

//   public static checkCriticalFeatures(): boolean {
//     const test = new BrowserCompatibilityTest();
//     const result = test.runCompatibilityTest();
    
//     // Vérifier s'il y a des erreurs critiques
//     if (result.errors.length > 0) {
//       Logger.warn('❌ Critical browser compatibility issues detected:', result.errors);
//       return false;
//     }
    
//     return true;
//   }

//   public static getCompatibilityInfo(): any {
//     const test = new BrowserCompatibilityTest();
//     return test.runCompatibilityTest();
//   }
// }