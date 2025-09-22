// import { CrashTest, CrashTestSuite } from './CrashTest';
// import { Logger } from '@/utils/logger.js'; 

// export class CrashTestUI {
//   private static testButton: HTMLElement | null = null;
//   private static crashTest = CrashTest.getInstance();

//   public static addCrashTestButton(): void {
//     if (typeof import.meta.env !== 'undefined' && import.meta.env.PROD) return;

//     if (this.testButton) {
//       this.testButton.remove();
//     }

//     this.testButton = document.createElement('div');
//     this.testButton.className = 'fixed bottom-4 left-4 z-50 space-y-2';
//     this.testButton.innerHTML = `
//       <button id="crash-test-btn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors block w-full">
//         💥 Crash Tests
//       </button>
//       <button id="quick-crash-btn" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors block w-full text-sm">
//         ⚡ Quick Crash
//       </button>
//     `;

//     document.body.appendChild(this.testButton);

//     document.getElementById('crash-test-btn')?.addEventListener('click', () => {
//       this.runFullCrashTest();
//     });

//     document.getElementById('quick-crash-btn')?.addEventListener('click', () => {
//       this.runQuickCrashCheck();
//     });
//   }

//   private static async runFullCrashTest(): Promise<void> {
//     Logger.log('💥 Running full crash test suite...');
    
//     try {
//       const result = await this.crashTest.runAllCrashTests();
//       this.showCrashTestModal(result);
//     } catch (error) {
//       Logger.error('❌ Crash test failed:', error);
//       this.showErrorModal('Crash test execution failed');
//     }
//   }

//   private static async runQuickCrashCheck(): Promise<void> {
//     Logger.log('⚡ Running quick crash check...');
    
//     try {
//       const result = await this.crashTest.runAllCrashTests();
//       this.showQuickCrashNotification(result);
//     } catch (error) {
//       Logger.error('❌ Quick crash check failed:', error);
//     }
//   }

//   private static showCrashTestModal(result: CrashTestSuite): void {
//     const modal = document.createElement('div');
//     modal.id = 'crash-test-modal';
//     modal.className = 'fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4';
    
//     const scoreColor = result.overallScore >= 80 ? 'text-green-400' : 
//                       result.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400';
    
//     const scoreIcon = result.overallScore >= 80 ? '✅' : 
//                       result.overallScore >= 60 ? '⚠️' : '❌';

//     modal.innerHTML = `
//       <div class="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
//         <div class="p-6">
//           <!-- Header -->
//           <div class="flex justify-between items-center mb-6">
//             <h2 class="text-2xl font-bold text-white flex items-center">
//               💥 Crash Test Report
//             </h2>
//             <button id="close-crash-modal" class="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors">
//               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
//               </svg>
//             </button>
//           </div>

//           <!-- Overall Score -->
//           <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//             <div class="bg-gray-700 rounded-lg p-4 text-center">
//               <h3 class="text-lg font-semibold text-white mb-2">Overall Score</h3>
//               <div class="text-4xl ${scoreColor} mb-2">${scoreIcon}</div>
//               <div class="text-3xl font-bold ${scoreColor}">${result.overallScore}/100</div>
//             </div>
            
//             <div class="bg-gray-700 rounded-lg p-4 text-center">
//               <h3 class="text-lg font-semibold text-white mb-2">Tests Passed</h3>
//               <div class="text-3xl font-bold text-green-400">
//                 ${result.tests.filter(t => t.passed).length}/${result.tests.length}
//               </div>
//             </div>
            
//             <div class="bg-gray-700 rounded-lg p-4 text-center">
//               <h3 class="text-lg font-semibold text-white mb-2">Critical Failures</h3>
//               <div class="text-3xl font-bold text-red-400">${result.criticalFailures}</div>
//             </div>
//           </div>

//           <!-- Test Results by Category -->
//           <div class="mb-6">
//             <h3 class="text-lg font-semibold text-white mb-4">Test Results</h3>
            
//             ${this.groupTestsByCategory(result.tests).map(category => `
//               <div class="mb-4">
//                 <h4 class="text-md font-medium text-gray-300 mb-2 capitalize">${category.name}</h4>
//                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
//                   ${category.tests.map(test => `
//                     <div class="flex items-center space-x-2 p-2 bg-gray-700 rounded ${test.passed ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}">
//                       <span class="text-lg">${test.passed ? '✅' : '❌'}</span>
//                       <div class="flex-1">
//                         <div class="text-sm text-gray-300">${test.testName}</div>
//                         <div class="text-xs text-gray-500">${test.duration}ms</div>
//                         ${test.error ? `<div class="text-xs text-red-400 mt-1">${test.error}</div>` : ''}
//                       </div>
//                       <span class="text-xs px-2 py-1 rounded ${
//                         test.severity === 'critical' ? 'bg-red-600 text-white' :
//                         test.severity === 'high' ? 'bg-orange-600 text-white' :
//                         test.severity === 'medium' ? 'bg-yellow-600 text-white' :
//                         'bg-gray-600 text-white'
//                       }">${test.severity}</span>
//                     </div>
//                   `).join('')}
//                 </div>
//               </div>
//             `).join('')}
//           </div>

//           <!-- Actions -->
//           <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
//             <button id="copy-crash-report" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
//               📋 Copy Report
//             </button>
//             <button id="close-crash-modal-btn" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
//               Close
//             </button>
//           </div>
//         </div>
//       </div>
//     `;

//     document.body.appendChild(modal);

//     // Events
//     const closeBtn = modal.querySelector('#close-crash-modal');
//     const closeBtnBottom = modal.querySelector('#close-crash-modal-btn');
//     const copyBtn = modal.querySelector('#copy-crash-report');

//     [closeBtn, closeBtnBottom].forEach(btn => {
//       btn?.addEventListener('click', () => {
//         modal.remove();
//       });
//     });

//     copyBtn?.addEventListener('click', () => {
//       const report = this.generateCrashReport(result);
//       navigator.clipboard.writeText(report).then(() => {
//         (copyBtn as HTMLElement).textContent = '✅ Copied!';
//         setTimeout(() => {
//           (copyBtn as HTMLElement).textContent = '📋 Copy Report';
//         }, 2000);
//       });
//     });

//     modal.addEventListener('click', (e) => {
//       if (e.target === modal) {
//         modal.remove();
//       }
//     });
//   }

//   private static groupTestsByCategory(tests: any[]): any[] {
//     const categories = {
//       'Network': tests.filter(t => t.testName.includes('Network') || t.testName.includes('WebSocket')),
//       'Game Engine': tests.filter(t => t.testName.includes('Canvas') || t.testName.includes('WebGL') || t.testName.includes('Game') || t.testName.includes('Physics') || t.testName.includes('Renderer')),
//       'Authentication': tests.filter(t => t.testName.includes('Token') || t.testName.includes('Session') || t.testName.includes('Auth')),
//       'Memory': tests.filter(t => t.testName.includes('Memory') || t.testName.includes('GC')),
//       'Security': tests.filter(t => t.testName.includes('XSS') || t.testName.includes('CSRF') || t.testName.includes('SQL') || t.testName.includes('File Upload')),
//       'File System': tests.filter(t => t.testName.includes('File') || t.testName.includes('Permission') || t.testName.includes('Disk')),
//       'Performance': tests.filter(t => t.testName.includes('CPU') || t.testName.includes('Frame') || t.testName.includes('Memory Spike'))
//     };

//     return Object.entries(categories)
//       .filter(([_, tests]) => tests.length > 0)
//       .map(([name, tests]) => ({ name, tests }));
//   }

//   private static showQuickCrashNotification(result: CrashTestSuite): void {
//     const notification = document.createElement('div');
//     notification.className = `fixed top-4 left-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
//       result.overallScore >= 80 ? 'bg-green-600' : 
//       result.overallScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
//     } text-white`;
    
//     const scoreIcon = result.overallScore >= 80 ? '✅' : 
//                       result.overallScore >= 60 ? '⚠️' : '❌';

//     notification.innerHTML = `
//       <div class="flex items-center space-x-2">
//         <span class="text-xl">${scoreIcon}</span>
//         <div>
//           <div class="font-semibold">Crash Test: ${result.overallScore}/100</div>
//           <div class="text-sm">${result.tests.filter(t => t.passed).length}/${result.tests.length} passed</div>
//           ${result.criticalFailures > 0 ? `<div class="text-xs mt-1">${result.criticalFailures} critical failures</div>` : ''}
//         </div>
//       </div>
//     `;

//     document.body.appendChild(notification);

//     setTimeout(() => {
//       notification.style.transform = 'translateX(-100%)';
//       notification.style.opacity = '0';
//       setTimeout(() => notification.remove(), 300);
//     }, 5000);
//   }

//   private static generateCrashReport(result: CrashTestSuite): string {
//     let report = `
// 💥 CRASH TEST REPORT
// ====================

// 📊 Overall Score: ${result.overallScore}/100
// ✅ Tests Passed: ${result.tests.filter(t => t.passed).length}/${result.tests.length}
// ❌ Critical Failures: ${result.criticalFailures}

// `;

//     const categories = this.groupTestsByCategory(result.tests);
    
//     categories.forEach(category => {
//       report += `\n🔧 ${category.name.toUpperCase()} TESTS:\n`;
//       category.tests.forEach(test => {
//         const status = test.passed ? '✅' : '❌';
//         const severity = test.severity.toUpperCase();
//         report += `${status} ${test.testName} (${severity}) - ${test.duration}ms\n`;
//         if (test.error) {
//           report += `   Error: ${test.error}\n`;
//         }
//       });
//     });

//     return report;
//   }

//   private static showErrorModal(message: string): void {
//     const modal = document.createElement('div');
//     modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4';
    
//     modal.innerHTML = `
//       <div class="bg-red-800 rounded-lg p-6 max-w-md w-full">
//         <h3 class="text-xl font-bold text-white mb-4">❌ Crash Test Error</h3>
//         <p class="text-red-200 mb-4">${message}</p>
//         <button onclick="this.parentElement.parentElement.remove()" 
//                 class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
//           Close
//         </button>
//       </div>
//     `;

//     document.body.appendChild(modal);
//   }
// }