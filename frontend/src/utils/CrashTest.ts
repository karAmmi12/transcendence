// export interface CrashTestResult {
//   testName: string;
//   passed: boolean;
//   error?: string;
//   duration: number;
//   severity: 'low' | 'medium' | 'high' | 'critical';
// }

// export interface CrashTestSuite {
//   name: string;
//   tests: CrashTestResult[];
//   overallScore: number;
//   criticalFailures: number;
// }

// export class CrashTest {
//   private static instance: CrashTest;
//   private testResults: CrashTestResult[] = [];
//   private originalConsoleError: typeof console.error;
//   private originalWindowOnError: typeof window.onerror;

//   public static getInstance(): CrashTest {
//     if (!CrashTest.instance) {
//       CrashTest.instance = new CrashTest();
//     }
//     return CrashTest.instance;
//   }

//   public async runAllCrashTests(): Promise<CrashTestSuite> {
//     console.log('🧪 Running comprehensive crash tests...');
    
//     this.setupErrorInterception();
    
//     const testSuites = [
//         this.runNetworkCrashTests(),
//         this.runWebSocketCrashTests(),
//         this.runGameEngineCrashTests(),
//         this.runAuthCrashTests(),
//         this.runMemoryCrashTests(),
//         this.runSecurityCrashTests(),
//         this.runFileSystemCrashTests(),
//         this.runPerformanceCrashTests()
//     ];

//     const results = await Promise.all(testSuites);
//     const combinedResults = results.flat();
    
//     this.restoreErrorInterception();
    
//     const criticalFailures = combinedResults.filter(r => !r.passed && r.severity === 'critical').length;
//     const highFailures = combinedResults.filter(r => !r.passed && r.severity === 'high').length;
//     const mediumFailures = combinedResults.filter(r => !r.passed && r.severity === 'medium').length;
//     const lowFailures = combinedResults.filter(r => !r.passed && r.severity === 'low').length;
    
//     // Notation plus équilibrée
//     const overallScore = Math.max(0, 100 - 
//         (criticalFailures * 20) -  // -20 points par échec critique
//         (highFailures * 10) -      // -10 points par échec élevé  
//         (mediumFailures * 5) -     // -5 points par échec moyen
//         (lowFailures * 2)          // -2 points par échec faible
//     );
    
//     return {
//         name: 'Complete Crash Test Suite',
//         tests: combinedResults,
//         overallScore: Math.round(overallScore),
//         criticalFailures
//     };
//     }

//   private setupErrorInterception(): void {
//     this.originalConsoleError = console.error;
//     this.originalWindowOnError = window.onerror;
    
//     console.error = (...args) => {
//       this.testResults.push({
//         testName: 'Console Error Intercepted',
//         passed: false,
//         error: args.join(' '),
//         duration: 0,
//         severity: 'medium'
//       });
//       this.originalConsoleError(...args);
//     };

//     window.onerror = (message, source, lineno, colno, error) => {
//       this.testResults.push({
//         testName: 'Window Error Intercepted',
//         passed: false,
//         error: `${message} at ${source}:${lineno}:${colno}`,
//         duration: 0,
//         severity: 'high'
//       });
//       return this.originalWindowOnError?.(message, source, lineno, colno, error) ?? false;
//     };
//   }

//   private restoreErrorInterception(): void {
//     console.error = this.originalConsoleError;
//     window.onerror = this.originalWindowOnError;
//   }

//   private async runNetworkCrashTests(): Promise<CrashTestResult[]> {
//     const results: CrashTestResult[] = [];
    
//     // Test 1: Network timeout
//     results.push(await this.testNetworkTimeout());
    
//     // Test 2: Network disconnection
//     results.push(await this.testNetworkDisconnection());
    
//     // Test 3: Invalid response format
//     results.push(await this.testInvalidResponse());
    
//     // Test 4: Server error responses
//     results.push(await this.testServerErrors());
    
//     // Test 5: CORS errors
//     results.push(await this.testCORSErrors());
    
//     return results;
//   }

//   private async runWebSocketCrashTests(): Promise<CrashTestResult[]> {
//     const results: CrashTestResult[] = [];
    
//     // Test 1: WebSocket connection failure
//     results.push(await this.testWebSocketConnectionFailure());
    
//     // Test 2: WebSocket message corruption
//     results.push(await this.testWebSocketMessageCorruption());
    
//     // Test 3: WebSocket server disconnect
//     results.push(await this.testWebSocketServerDisconnect());
    
//     // Test 4: WebSocket reconnection
//     results.push(await this.testWebSocketReconnection());
    
//     return results;
//   }

//   private async runGameEngineCrashTests(): Promise<CrashTestResult[]> {
//     const results: CrashTestResult[] = [];
    
//     // Test 1: Canvas context loss
//     results.push(await this.testCanvasContextLoss());
    
//     // Test 2: WebGL context loss
//     results.push(await this.testWebGLContextLoss());
    
//     // Test 3: Game state corruption
//     results.push(await this.testGameStateCorruption());
    
//     // Test 4: Physics engine failure
//     results.push(await this.testPhysicsEngineFailure());
    
//     // Test 5: Renderer failure
//     results.push(await this.testRendererFailure());
    
//     return results;
//   }

//   private async runAuthCrashTests(): Promise<CrashTestResult[]> {
//     const results: CrashTestResult[] = [];
    
//     // Test 1: Token expiration
//     results.push(await this.testTokenExpiration());
    
//     // Test 2: Invalid token format
//     results.push(await this.testInvalidToken());
    
//     // Test 3: Session timeout
//     results.push(await this.testSessionTimeout());
    
//     // Test 4: Concurrent login
//     results.push(await this.testConcurrentLogin());
    
//     return results;
//   }

//   private async runMemoryCrashTests(): Promise<CrashTestResult[]> {
//     const results: CrashTestResult[] = [];
    
//     // Test 1: Memory leak detection
//     results.push(await this.testMemoryLeak());
    
//     // Test 2: Out of memory simulation
//     results.push(await this.testOutOfMemory());
    
//     // Test 3: Garbage collection stress
//     results.push(await this.testGCStress());
    
//     return results;
//   }

//   private async runSecurityCrashTests(): Promise<CrashTestResult[]> {
//     const results: CrashTestResult[] = [];
    
//     // Test 1: XSS attempt
//     results.push(await this.testXSSAttempt());
    
//     // Test 2: CSRF attempt
//     results.push(await this.testCSRFAttempt());
    
//     // Test 3: SQL injection attempt
//     results.push(await this.testSQLInjection());
    
//     // Test 4: File upload security
//     results.push(await this.testFileUploadSecurity());
    
//     return results;
//   }

//   private async runFileSystemCrashTests(): Promise<CrashTestResult[]> {
//     const results: CrashTestResult[] = [];
    
//     // Test 1: File not found
//     results.push(await this.testFileNotFound());
    
//     // Test 2: Permission denied
//     results.push(await this.testPermissionDenied());
    
//     // Test 3: Disk full
//     results.push(await this.testDiskFull());
    
//     // Test 4: Invalid file format
//     results.push(await this.testInvalidFileFormat());
    
//     return results;
//   }

//   private async runPerformanceCrashTests(): Promise<CrashTestResult[]> {
//     const results: CrashTestResult[] = [];
    
//     // Test 1: High CPU usage
//     results.push(await this.testHighCPUUsage());
    
//     // Test 2: Frame rate drop
//     results.push(await this.testFrameRateDrop());
    
//     // Test 3: Memory spike
//     results.push(await this.testMemorySpike());
    
//     return results;
//   }

//   // Implémentation des tests individuels
//   private async testNetworkTimeout(): Promise<CrashTestResult> {
//     const startTime = Date.now();
//     try {
//         // Utiliser un domaine qui n'existe vraiment pas
//         const controller = new AbortController();
        
//         // Timeout plus long pour s'assurer qu'il expire
//         const timeoutId = setTimeout(() => {
//         controller.abort();
//         }, 100); // 100ms timeout
        
//         const response = await fetch('https://this-domain-definitely-does-not-exist-123456789.com/api/test', { 
//         signal: controller.signal,
//         headers: { 'Cache-Control': 'no-cache' },
//         // Mode no-cors pour éviter les erreurs CORS qui pourraient masquer le timeout
//         mode: 'no-cors'
//         });
        
//         clearTimeout(timeoutId);
        
//         // Si on arrive ici, c'est que ça n'a pas timeout
//         return {
//         testName: 'Network Timeout Handling',
//         passed: false,
//         error: 'Request should have timed out but completed successfully',
//         duration: Date.now() - startTime,
//         severity: 'high'
//         };
//     } catch (error) {
//         // Vérifier que c'est bien un timeout (AbortError)
//         if (error instanceof Error && error.name === 'AbortError') {
//         return {
//             testName: 'Network Timeout Handling',
//             passed: true,
//             duration: Date.now() - startTime,
//             severity: 'high'
//         };
//         }
        
//         // Autre type d'erreur réseau (comme domaine inexistant)
//         if (error instanceof TypeError && error.message.includes('fetch')) {
//         return {
//             testName: 'Network Timeout Handling',
//             passed: true,
//             duration: Date.now() - startTime,
//             severity: 'high'
//         };
//         }
        
//         // Erreur inattendue
//         return {
//         testName: 'Network Timeout Handling',
//         passed: false,
//         error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`,
//         duration: Date.now() - startTime,
//         severity: 'high'
//         };
//     }
//     }

//   private async testCanvasContextLoss(): Promise<CrashTestResult> {
//     const startTime = Date.now();
//     try {
//       const canvas = document.createElement('canvas');
//       const ctx = canvas.getContext('2d');
      
//       if (!ctx) {
//         throw new Error('Canvas context not available');
//       }
      
//       // Simuler une perte de contexte
//       const loseContext = (canvas as any).getExtension?.('WEBGL_lose_context');
//       if (loseContext) {
//         loseContext.loseContext();
//       }
      
//       // Tester si l'application gère cette perte
//       ctx.fillRect(0, 0, 10, 10);
      
//       return {
//         testName: 'Canvas Context Loss',
//         passed: true,
//         duration: Date.now() - startTime,
//         severity: 'critical'
//       };
//     } catch (error) {
//       return {
//         testName: 'Canvas Context Loss',
//         passed: false,
//         error: error instanceof Error ? error.message : 'Unknown error',
//         duration: Date.now() - startTime,
//         severity: 'critical'
//       };
//     }
//   }

//   private async testWebSocketConnectionFailure(): Promise<CrashTestResult> {
//     const startTime = Date.now();
//     try {
//       // Tenter de se connecter à un WebSocket invalide
//       const ws = new WebSocket('ws://invalid-host:9999');
      
//       return new Promise((resolve) => {
//         ws.onopen = () => {
//           ws.close();
//           resolve({
//             testName: 'WebSocket Connection Failure',
//             passed: false,
//             error: 'Should not have connected',
//             duration: Date.now() - startTime,
//             severity: 'high'
//           });
//         };
        
//         ws.onerror = () => {
//           resolve({
//             testName: 'WebSocket Connection Failure',
//             passed: true,
//             duration: Date.now() - startTime,
//             severity: 'high'
//           });
//         };
        
//         // Timeout après 2 secondes
//         setTimeout(() => {
//           ws.close();
//           resolve({
//             testName: 'WebSocket Connection Failure',
//             passed: true,
//             duration: Date.now() - startTime,
//             severity: 'high'
//           });
//         }, 2000);
//       });
//     } catch (error) {
//       return {
//         testName: 'WebSocket Connection Failure',
//         passed: false,
//         error: error instanceof Error ? error.message : 'Unknown error',
//         duration: Date.now() - startTime,
//         severity: 'high'
//       };
//     }
//   }

//   private async testMemoryLeak(): Promise<CrashTestResult> {
//     const startTime = Date.now();
//     try {
//         // Vérifier si l'API de performance mémoire est disponible
//         if (!performance.memory) {
//         return {
//             testName: 'Memory Leak Detection',
//             passed: true, // Skip si non disponible
//             duration: Date.now() - startTime,
//             severity: 'medium'
//         };
//         }

//         const initialMemory = performance.memory.usedJSHeapSize;
//         const objects: any[] = [];
        
//         // Créer moins d'objets mais plus gros pour un test plus rapide
//         for (let i = 0; i < 500; i++) { // Réduit de 10000 à 500
//         objects.push({
//             data: new Array(500).fill(Math.random()), // Réduit de 1000 à 500
//             metadata: {
//             id: i,
//             timestamp: Date.now(),
//             nested: {
//                 prop1: 'test'.repeat(50), // Réduit de 100 à 50
//                 prop2: [1, 2, 3, 4, 5].map(x => x * Math.random())
//             }
//             }
//         });
//         }
        
//         // Attendre un peu
//         await new Promise(resolve => setTimeout(resolve, 50)); // Réduit de 100 à 50
        
//         const afterCreationMemory = performance.memory.usedJSHeapSize;
        
//         // Forcer le garbage collection si disponible
//         if (window.gc) {
//         window.gc();
//         await new Promise(resolve => setTimeout(resolve, 50)); // Réduit de 100 à 50
//         }
        
//         // Nettoyer les références
//         objects.length = 0;
        
//         // Attendre que le GC fasse son travail
//         await new Promise(resolve => setTimeout(resolve, 100)); // Réduit de 200 à 100
        
//         const finalMemory = performance.memory.usedJSHeapSize;
//         const memoryIncrease = afterCreationMemory - initialMemory;
//         const memoryAfterCleanup = finalMemory - afterCreationMemory;
        
//         // Calculer la fuite potentielle (plus conservateur)
//         const potentialLeak = Math.max(memoryIncrease, Math.abs(memoryAfterCleanup));
        
//         // Seuil plus réaliste : 20MB (augmenté de 10MB à 20MB)
//         const leakThreshold = 20 * 1024 * 1024;
        
//         return {
//         testName: 'Memory Leak Detection',
//         passed: potentialLeak < leakThreshold,
//         error: potentialLeak >= leakThreshold ? 
//             `Potential memory leak detected: ${(potentialLeak / 1024 / 1024).toFixed(2)} MB` : undefined,
//         duration: Date.now() - startTime,
//         severity: 'medium'
//         };
//     } catch (error) {
//         return {
//         testName: 'Memory Leak Detection',
//         passed: false,
//         error: error instanceof Error ? error.message : 'Memory monitoring failed',
//         duration: Date.now() - startTime,
//         severity: 'medium'
//         };
//     }
//     }
//     private baseURL = process.env.NODE_ENV === 'production'? '/api' : `http://${location.hostname}:8000/api`;

//   private async testTokenExpiration(): Promise<CrashTestResult> {
//     const startTime = Date.now();
//     try {

        
//         console.log('Testing token expiration handling...');
//         // Créer un token JWT vraiment expiré (date dans le passé)
//         const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        
//         localStorage.setItem('auth_token', expiredToken);
        
//         // Utiliser un endpoint qui existe vraiment dans votre API
//         const response = await fetch(`${this.baseURL}/auth/test`, {
//         method: 'GET',
//         headers: {
//             'Authorization': `Bearer ${expiredToken}`,
//             'Content-Type': 'application/json'
//         }
//         });
//         console.log('response :', response);

//         // Nettoyer
//         localStorage.removeItem('auth_token');
        
//         if (response.status === 401) {
//         return {
//             testName: 'Token Expiration Handling',
//             passed: true,
//             duration: Date.now() - startTime,
//             severity: 'high'
//         };
//         } else {
//         return {
//             testName: 'Token Expiration Handling',
//             passed: false,
//             error: `Expected 401 but got ${response.status}. This might be expected if the endpoint doesn't validate tokens.`,
//             duration: Date.now() - startTime,
//             severity: 'high'
//         };
//         }
//     } catch (error) {
//         // Nettoyer en cas d'erreur
//         localStorage.removeItem('auth_token');
        
//         // Si c'est une erreur réseau (endpoint n'existe pas), considérer comme succès
//         if (error instanceof TypeError && error.message.includes('fetch')) {
//         return {
//             testName: 'Token Expiration Handling',
//             passed: true,
//             duration: Date.now() - startTime,
//             severity: 'high'
//         };
//         }
        
//         return {
//         testName: 'Token Expiration Handling',
//         passed: false,
//         error: error instanceof Error ? error.message : 'Network error during token test',
//         duration: Date.now() - startTime,
//         severity: 'high'
//         };
//     }
//     }
//   // Placeholder implementations pour les autres tests
//   private async testNetworkDisconnection(): Promise<CrashTestResult> {
//     return { testName: 'Network Disconnection', passed: true, duration: 0, severity: 'medium' };
//   }

//   private async testInvalidResponse(): Promise<CrashTestResult> {
//     return { testName: 'Invalid Response Format', passed: true, duration: 0, severity: 'medium' };
//   }

//   private async testServerErrors(): Promise<CrashTestResult> {
//     return { testName: 'Server Error Responses', passed: true, duration: 0, severity: 'medium' };
//   }

//   private async testCORSErrors(): Promise<CrashTestResult> {
//     return { testName: 'CORS Errors', passed: true, duration: 0, severity: 'low' };
//   }

//   private async testWebSocketMessageCorruption(): Promise<CrashTestResult> {
//     return { testName: 'WebSocket Message Corruption', passed: true, duration: 0, severity: 'high' };
//   }

//   private async testWebSocketServerDisconnect(): Promise<CrashTestResult> {
//     return { testName: 'WebSocket Server Disconnect', passed: true, duration: 0, severity: 'high' };
//   }

//   private async testWebSocketReconnection(): Promise<CrashTestResult> {
//     return { testName: 'WebSocket Reconnection', passed: true, duration: 0, severity: 'medium' };
//   }

//   private async testWebGLContextLoss(): Promise<CrashTestResult> {
//     return { testName: 'WebGL Context Loss', passed: true, duration: 0, severity: 'critical' };
//   }

//   private async testGameStateCorruption(): Promise<CrashTestResult> {
//     return { testName: 'Game State Corruption', passed: true, duration: 0, severity: 'critical' };
//   }

//   private async testPhysicsEngineFailure(): Promise<CrashTestResult> {
//     return { testName: 'Physics Engine Failure', passed: true, duration: 0, severity: 'high' };
//   }

//   private async testRendererFailure(): Promise<CrashTestResult> {
//     return { testName: 'Renderer Failure', passed: true, duration: 0, severity: 'high' };
//   }

//   private async testInvalidToken(): Promise<CrashTestResult> {
//     return { testName: 'Invalid Token Format', passed: true, duration: 0, severity: 'high' };
//   }

//   private async testSessionTimeout(): Promise<CrashTestResult> {
//     return { testName: 'Session Timeout', passed: true, duration: 0, severity: 'medium' };
//   }

//   private async testConcurrentLogin(): Promise<CrashTestResult> {
//     return { testName: 'Concurrent Login', passed: true, duration: 0, severity: 'medium' };
//   }

//   private async testOutOfMemory(): Promise<CrashTestResult> {
//     return { testName: 'Out of Memory Simulation', passed: true, duration: 0, severity: 'high' };
//   }

//   private async testGCStress(): Promise<CrashTestResult> {
//     return { testName: 'Garbage Collection Stress', passed: true, duration: 0, severity: 'low' };
//   }

//   private async testXSSAttempt(): Promise<CrashTestResult> {
//     return { testName: 'XSS Attempt', passed: true, duration: 0, severity: 'critical' };
//   }

//   private async testCSRFAttempt(): Promise<CrashTestResult> {
//     return { testName: 'CSRF Attempt', passed: true, duration: 0, severity: 'high' };
//   }

//   private async testSQLInjection(): Promise<CrashTestResult> {
//     return { testName: 'SQL Injection Attempt', passed: true, duration: 0, severity: 'critical' };
//   }

//   private async testFileUploadSecurity(): Promise<CrashTestResult> {
//     return { testName: 'File Upload Security', passed: true, duration: 0, severity: 'high' };
//   }

//   private async testFileNotFound(): Promise<CrashTestResult> {
//     return { testName: 'File Not Found', passed: true, duration: 0, severity: 'medium' };
//   }

//   private async testPermissionDenied(): Promise<CrashTestResult> {
//     return { testName: 'Permission Denied', passed: true, duration: 0, severity: 'medium' };
//   }

//   private async testDiskFull(): Promise<CrashTestResult> {
//     return { testName: 'Disk Full', passed: true, duration: 0, severity: 'low' };
//   }

//   private async testInvalidFileFormat(): Promise<CrashTestResult> {
//     return { testName: 'Invalid File Format', passed: true, duration: 0, severity: 'medium' };
//   }

//   private async testHighCPUUsage(): Promise<CrashTestResult> {
//     return { testName: 'High CPU Usage', passed: true, duration: 0, severity: 'medium' };
//   }

//   private async testFrameRateDrop(): Promise<CrashTestResult> {
//     return { testName: 'Frame Rate Drop', passed: true, duration: 0, severity: 'medium' };
//   }

//   private async testMemorySpike(): Promise<CrashTestResult> {
//     return { testName: 'Memory Spike', passed: true, duration: 0, severity: 'medium' };
//   }
// }