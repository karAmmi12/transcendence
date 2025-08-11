// export class MobileTestUtils {
//   private static testButton: HTMLElement | null = null;

//   public static addResponsiveTestButton(): void {
//     if (typeof import.meta.env !== 'undefined' && import.meta.env.PROD) return;

//     // Supprimer le bouton existant s'il y en a un
//     if (this.testButton) {
//       this.testButton.remove();
//     }

//     this.testButton = document.createElement('div');
//     this.testButton.className = 'fixed bottom-4 right-4 z-50 space-y-2';
//     this.testButton.innerHTML = `
//       <button id="responsive-test-btn" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors">
//         📱 Test Responsive
//       </button>
//       <button id="mobile-preview-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors block w-full">
//         📲 Mobile Preview
//       </button>
//       <button id="tablet-preview-btn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors block w-full">
//         📟 Tablet Preview
//       </button>
//     `;

//     document.body.appendChild(this.testButton);

//     // Événements
//     document.getElementById('responsive-test-btn')?.addEventListener('click', () => {
//       this.runResponsiveTests();
//     });

//     document.getElementById('mobile-preview-btn')?.addEventListener('click', () => {
//       this.previewMobile();
//     });

//     document.getElementById('tablet-preview-btn')?.addEventListener('click', () => {
//       this.previewTablet();
//     });
//   }

//   private static async runResponsiveTests(): Promise<void> {
//     const { ResponsiveTest } = await import('./ResponsiveTest');
//     const tester = new ResponsiveTest();
//     await tester.runAllTests();
//   }

//   private static previewMobile(): void {
//     this.createPreviewFrame(375, 667, 'iPhone SE');
//   }

//   private static previewTablet(): void {
//     this.createPreviewFrame(768, 1024, 'iPad');
//   }

//   private static createPreviewFrame(width: number, height: number, deviceName: string): void {
//     // Supprimer la frame existante
//     const existingFrame = document.getElementById('device-preview-frame');
//     if (existingFrame) {
//       existingFrame.remove();
//       return; // Toggle - fermer si déjà ouvert
//     }

//     // Créer la frame de prévisualisation
//     const frame = document.createElement('div');
//     frame.id = 'device-preview-frame';
//     frame.className = 'fixed top-4 left-4 z-50 bg-gray-900 rounded-lg shadow-2xl';
//     frame.style.width = `${width + 20}px`;
//     frame.style.height = `${height + 60}px`;

//     frame.innerHTML = `
//       <div class="bg-gray-800 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
//         <span class="font-mono text-sm">${deviceName} - ${width}x${height}</span>
//         <button id="close-preview" class="text-gray-400 hover:text-white">✕</button>
//       </div>
//       <iframe 
//         src="${window.location.href}" 
//         class="w-full rounded-b-lg border-none"
//         style="width: ${width}px; height: ${height}px;"
//       ></iframe>
//     `;

//     document.body.appendChild(frame);

//     // Fermer la preview
//     document.getElementById('close-preview')?.addEventListener('click', () => {
//       frame.remove();
//     });
//   }

//   public static addViewportInfo(): void {
//     if (typeof import.meta.env !== 'undefined' && import.meta.env.PROD) return;

//     const info = document.createElement('div');
//     info.id = 'viewport-info';
//     info.className = 'fixed top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm font-mono z-40';
    
//     const updateInfo = () => {
//       info.textContent = `${window.innerWidth}x${window.innerHeight}`;
//     };

//     updateInfo();
//     window.addEventListener('resize', updateInfo);
    
//     document.body.appendChild(info);
//   }

//   public static simulateDeviceOrientation(): void {
//     const button = document.createElement('button');
//     button.className = 'fixed bottom-4 left-4 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg shadow-lg z-50';
//     button.textContent = '🔄 Rotate';
    
//     let isRotated = false;
    
//     button.addEventListener('click', () => {
//       isRotated = !isRotated;
      
//       if (isRotated) {
//         document.body.style.transform = 'rotate(90deg)';
//         document.body.style.transformOrigin = 'center center';
//         document.body.style.width = '100vh';
//         document.body.style.height = '100vw';
//         button.textContent = '🔄 Portrait';
//       } else {
//         document.body.style.transform = '';
//         document.body.style.transformOrigin = '';
//         document.body.style.width = '';
//         document.body.style.height = '';
//         button.textContent = '🔄 Rotate';
//       }
//     });
    
//     document.body.appendChild(button);
//   }
// }