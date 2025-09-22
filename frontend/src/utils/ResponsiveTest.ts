// import { i18n } from '@services/i18n';
// import { Logger } from '@/utils/logger.js'; 

// interface Breakpoint {
//   name: string;
//   width: number;
//   height: number;
//   description: string;
// }

// export class ResponsiveTest {
//   private breakpoints: Breakpoint[] = [
//     { name: 'mobile-portrait', width: 375, height: 667, description: 'iPhone SE Portrait' },
//     { name: 'mobile-landscape', width: 667, height: 375, description: 'iPhone SE Landscape' },
//     { name: 'mobile-large', width: 414, height: 896, description: 'iPhone 11 Pro' },
//     { name: 'tablet-portrait', width: 768, height: 1024, description: 'iPad Portrait' },
//     { name: 'tablet-landscape', width: 1024, height: 768, description: 'iPad Landscape' },
//     { name: 'desktop-small', width: 1280, height: 720, description: 'Desktop Small' },
//     { name: 'desktop-large', width: 1920, height: 1080, description: 'Desktop Large' }
//   ];

//   private testResults: Map<string, any> = new Map();

//   public async runAllTests(): Promise<void> {
//     Logger.log('🧪 Starting responsive tests...');
    
//     for (const breakpoint of this.breakpoints) {
//       await this.testBreakpoint(breakpoint);
//       // Pause entre les tests pour voir les changements
//       await this.delay(2000);
//     }

//     this.generateReport();
//   }

//   private async testBreakpoint(breakpoint: Breakpoint): Promise<void> {
//     Logger.log(`📱 Testing: ${breakpoint.description} (${breakpoint.width}x${breakpoint.height})`);
    
//     // Simuler le changement de viewport
//     this.simulateViewport(breakpoint.width, breakpoint.height);
    
//     // Attendre que le DOM se mette à jour
//     await this.delay(500);
    
//     const results = {
//       navigation: this.testNavigation(breakpoint),
//       gameCanvas: this.testGameCanvas(breakpoint),
//       forms: this.testForms(breakpoint),
//       layout: this.testLayout(breakpoint),
//       typography: this.testTypography(breakpoint),
//       interactions: this.testInteractions(breakpoint)
//     };

//     this.testResults.set(breakpoint.name, {
//       breakpoint,
//       results,
//       timestamp: new Date().toISOString()
//     });
//   }

//   private simulateViewport(width: number, height: number): void {
//     // Créer un overlay de test pour visualiser la taille
//     this.createViewportOverlay(width, height);
    
//     // Déclencher les media queries CSS
//     document.documentElement.style.setProperty('--test-viewport-width', `${width}px`);
//     document.documentElement.style.setProperty('--test-viewport-height', `${height}px`);
    
//     // Simuler le resize event
//     window.dispatchEvent(new Event('resize'));
//   }

//   private createViewportOverlay(width: number, height: number): void {
//     // Supprimer l'ancien overlay s'il existe
//     const existingOverlay = document.getElementById('responsive-test-overlay');
//     if (existingOverlay) {
//       existingOverlay.remove();
//     }

//     // Créer le nouvel overlay
//     const overlay = document.createElement('div');
//     overlay.id = 'responsive-test-overlay';
//     overlay.className = 'fixed top-0 left-0 z-50 bg-red-500 bg-opacity-20 border-2 border-red-500 pointer-events-none';
//     overlay.style.width = `${width}px`;
//     overlay.style.height = `${height}px`;
    
//     const label = document.createElement('div');
//     label.className = 'bg-red-500 text-white px-2 py-1 text-sm font-mono';
//     label.textContent = `${width}x${height}`;
    
//     overlay.appendChild(label);
//     document.body.appendChild(overlay);
//   }

//   private testNavigation(breakpoint: Breakpoint): any {
//     const header = document.querySelector('#header');
//     const mobileMenu = document.querySelector('#mobile-menu');
//     const mobileMenuBtn = document.querySelector('#mobile-menu-btn');
    
//     const isMobile = breakpoint.width < 768;
    
//     return {
//       headerExists: !!header,
//       mobileMenuVisible: isMobile ? !mobileMenu?.classList.contains('hidden') : true,
//       mobileMenuBtnVisible: isMobile ? this.isElementVisible(mobileMenuBtn) : true,
//       desktopNavVisible: !isMobile ? this.isElementVisible(document.querySelector('.hidden.md\\:flex')) : true,
//       navigationAccessible: this.checkNavigationAccessibility(),
//       score: this.calculateNavigationScore(isMobile, mobileMenu, mobileMenuBtn)
//     };
//   }

//   private testGameCanvas(breakpoint: Breakpoint): any {
//     const gameCanvas = document.querySelector('#pong-canvas') as HTMLCanvasElement;
    
//     if (!gameCanvas) {
//       return { exists: false, score: 0 };
//     }

//     const rect = gameCanvas.getBoundingClientRect();
//     const containerWidth = gameCanvas.parentElement?.getBoundingClientRect().width || 0;
    
//     return {
//       exists: true,
//       responsive: rect.width <= containerWidth,
//       aspectRatio: this.checkAspectRatio(gameCanvas, breakpoint),
//       scalingCorrect: this.checkCanvasScaling(gameCanvas, breakpoint),
//       touchFriendly: breakpoint.width <= 768 ? this.checkTouchControls() : true,
//       score: this.calculateGameCanvasScore(gameCanvas, breakpoint)
//     };
//   }

//   private testForms(breakpoint: Breakpoint): any {
//     const forms = document.querySelectorAll('form');
//     const results: any[] = [];
    
//     forms.forEach((form, index) => {
//       const inputs = form.querySelectorAll('input, select, textarea');
//       const buttons = form.querySelectorAll('button');
      
//       results.push({
//         formIndex: index,
//         inputsAccessible: this.checkInputAccessibility(inputs, breakpoint),
//         buttonsClickable: this.checkButtonClickability(buttons, breakpoint),
//         formLayout: this.checkFormLayout(form, breakpoint)
//       });
//     });

//     return {
//       totalForms: forms.length,
//       formResults: results,
//       score: this.calculateFormsScore(results)
//     };
//   }

//   private testLayout(breakpoint: Breakpoint): any {
//     const mainContent = document.querySelector('#main-content');
//     const footer = document.querySelector('#footer');
    
//     return {
//       noHorizontalScroll: document.documentElement.scrollWidth <= window.innerWidth,
//       contentVisible: this.isElementVisible(mainContent),
//       footerPosition: this.checkFooterPosition(footer),
//       containerMargins: this.checkContainerMargins(breakpoint),
//       score: this.calculateLayoutScore(breakpoint)
//     };
//   }

//   private testTypography(breakpoint: Breakpoint): any {
//     const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
//     const paragraphs = document.querySelectorAll('p');
    
//     return {
//       headingsReadable: this.checkTextReadability(headings, breakpoint),
//       paragraphsReadable: this.checkTextReadability(paragraphs, breakpoint),
//       fontSizeAppropriate: this.checkFontSizes(breakpoint),
//       score: this.calculateTypographyScore(headings, paragraphs, breakpoint)
//     };
//   }

//   private testInteractions(breakpoint: Breakpoint): any {
//     const buttons = document.querySelectorAll('button, .btn');
//     const links = document.querySelectorAll('a');
    
//     const isTouchDevice = breakpoint.width <= 768;
    
//     return {
//       buttonsMinSize: isTouchDevice ? this.checkMinTouchSize(buttons) : true,
//       linksMinSize: isTouchDevice ? this.checkMinTouchSize(links) : true,
//       hoverStates: !isTouchDevice ? this.checkHoverStates(buttons) : true,
//       focusStates: this.checkFocusStates([...buttons, ...links]),
//       score: this.calculateInteractionScore(buttons, links, breakpoint)
//     };
//   }

//   // Méthodes utilitaires
//   private isElementVisible(element: Element | null): boolean {
//     if (!element) return false;
//     const style = window.getComputedStyle(element);
//     return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
//   }

//   private checkAspectRatio(canvas: HTMLCanvasElement, breakpoint: Breakpoint): boolean {
//     const rect = canvas.getBoundingClientRect();
//     const ratio = rect.width / rect.height;
    
//     // Le canvas doit garder un ratio acceptable
//     if (breakpoint.width <= 768) {
//       return ratio >= 1.2 && ratio <= 2; // Plus carré sur mobile
//     }
//     return ratio >= 1.5 && ratio <= 2.5; // Plus large sur desktop
//   }

//   private checkCanvasScaling(canvas: HTMLCanvasElement, breakpoint: Breakpoint): boolean {
//     const rect = canvas.getBoundingClientRect();
//     const maxWidth = breakpoint.width * 0.9; // 90% de la largeur de l'écran
//     return rect.width <= maxWidth;
//   }

//   private checkTouchControls(): boolean {
//     // Vérifier si les contrôles tactiles sont disponibles
//     const touchElements = document.querySelectorAll('[data-touch-control]');
//     return touchElements.length > 0;
//   }

//   private checkInputAccessibility(inputs: NodeListOf<Element>, breakpoint: Breakpoint): boolean {
//     const isMobile = breakpoint.width <= 768;
    
//     for (const input of inputs) {
//       const rect = input.getBoundingClientRect();
//       const minHeight = isMobile ? 44 : 32; // 44px minimum sur mobile
      
//       if (rect.height < minHeight) {
//         return false;
//       }
//     }
//     return true;
//   }

//   private checkButtonClickability(buttons: NodeListOf<Element>, breakpoint: Breakpoint): boolean {
//     const isMobile = breakpoint.width <= 768;
    
//     for (const button of buttons) {
//       const rect = button.getBoundingClientRect();
//       const minSize = isMobile ? 44 : 32;
      
//       if (rect.width < minSize || rect.height < minSize) {
//         return false;
//       }
//     }
//     return true;
//   }

//   private checkFormLayout(form: Element, breakpoint: Breakpoint): boolean {
//     const rect = form.getBoundingClientRect();
//     return rect.width <= breakpoint.width * 0.95; // Formulaire ne dépasse pas 95% de l'écran
//   }

//   private checkFooterPosition(footer: Element | null): boolean {
//     if (!footer) return true;
    
//     const rect = footer.getBoundingClientRect();
//     const windowHeight = window.innerHeight;
    
//     // Le footer doit être en bas de la page
//     return rect.bottom <= windowHeight + 100; // Marge de 100px
//   }

//   private checkContainerMargins(breakpoint: Breakpoint): boolean {
//     const containers = document.querySelectorAll('.container');
    
//     for (const container of containers) {
//       const rect = container.getBoundingClientRect();
//       const expectedMargin = breakpoint.width <= 768 ? 16 : 32;
      
//       if (rect.left < expectedMargin || rect.right > breakpoint.width - expectedMargin) {
//         return false;
//       }
//     }
//     return true;
//   }

//   private checkTextReadability(elements: NodeListOf<Element>, breakpoint: Breakpoint): boolean {
//     for (const element of elements) {
//       const style = window.getComputedStyle(element);
//       const fontSize = parseInt(style.fontSize);
//       const minSize = breakpoint.width <= 768 ? 14 : 12;
      
//       if (fontSize < minSize) {
//         return false;
//       }
//     }
//     return true;
//   }

//   private checkFontSizes(breakpoint: Breakpoint): boolean {
//     const bodyStyle = window.getComputedStyle(document.body);
//     const bodyFontSize = parseInt(bodyStyle.fontSize);
//     const minBodySize = breakpoint.width <= 768 ? 16 : 14;
    
//     return bodyFontSize >= minBodySize;
//   }

//   private checkMinTouchSize(elements: NodeListOf<Element>): boolean {
//     for (const element of elements) {
//       const rect = element.getBoundingClientRect();
//       if (rect.width < 44 || rect.height < 44) {
//         return false;
//       }
//     }
//     return true;
//   }

//   private checkHoverStates(buttons: NodeListOf<Element>): boolean {
//     // Simuler le hover pour vérifier si les styles changent
//     for (const button of buttons) {
//       const beforeHover = window.getComputedStyle(button).backgroundColor;
//       button.dispatchEvent(new MouseEvent('mouseenter'));
//       const afterHover = window.getComputedStyle(button).backgroundColor;
//       button.dispatchEvent(new MouseEvent('mouseleave'));
      
//       if (beforeHover === afterHover) {
//         return false; // Pas d'état hover détecté
//       }
//     }
//     return true;
//   }

//   private checkFocusStates(elements: Element[]): boolean {
//     for (const element of elements) {
//       const beforeFocus = window.getComputedStyle(element).outline;
//       (element as HTMLElement).focus();
//       const afterFocus = window.getComputedStyle(element).outline;
//       (element as HTMLElement).blur();
      
//       if (beforeFocus === afterFocus && afterFocus === 'none') {
//         return false; // Pas d'état focus visible
//       }
//     }
//     return true;
//   }

//   // Méthodes de calcul de score
//   private calculateNavigationScore(isMobile: boolean, mobileMenu: Element | null, mobileMenuBtn: Element | null): number {
//     let score = 0;
//     if (isMobile && mobileMenu && mobileMenuBtn) score += 50;
//     if (!isMobile) score += 50;
//     return score;
//   }

//   private calculateGameCanvasScore(canvas: HTMLCanvasElement, breakpoint: Breakpoint): number {
//     let score = 0;
//     const rect = canvas.getBoundingClientRect();
    
//     // Responsive
//     if (rect.width <= breakpoint.width * 0.9) score += 25;
    
//     // Aspect ratio
//     if (this.checkAspectRatio(canvas, breakpoint)) score += 25;
    
//     // Scaling
//     if (this.checkCanvasScaling(canvas, breakpoint)) score += 25;
    
//     // Touch controls sur mobile
//     if (breakpoint.width <= 768 && this.checkTouchControls()) score += 25;
//     else if (breakpoint.width > 768) score += 25;
    
//     return score;
//   }

//   private calculateFormsScore(formResults: any[]): number {
//     if (formResults.length === 0) return 100;
    
//     let totalScore = 0;
//     for (const result of formResults) {
//       let formScore = 0;
//       if (result.inputsAccessible) formScore += 33;
//       if (result.buttonsClickable) formScore += 33;
//       if (result.formLayout) formScore += 34;
//       totalScore += formScore;
//     }
    
//     return Math.round(totalScore / formResults.length);
//   }

//   private calculateLayoutScore(breakpoint: Breakpoint): number {
//     let score = 0;
    
//     // Pas de scroll horizontal
//     if (document.documentElement.scrollWidth <= window.innerWidth) score += 30;
    
//     // Marges appropriées
//     if (this.checkContainerMargins(breakpoint)) score += 35;
    
//     // Footer position
//     if (this.checkFooterPosition(document.querySelector('#footer'))) score += 35;
    
//     return score;
//   }

//   private calculateTypographyScore(headings: NodeListOf<Element>, paragraphs: NodeListOf<Element>, breakpoint: Breakpoint): number {
//     let score = 0;
    
//     if (this.checkTextReadability(headings, breakpoint)) score += 40;
//     if (this.checkTextReadability(paragraphs, breakpoint)) score += 40;
//     if (this.checkFontSizes(breakpoint)) score += 20;
    
//     return score;
//   }

//   private calculateInteractionScore(buttons: NodeListOf<Element>, links: NodeListOf<Element>, breakpoint: Breakpoint): number {
//     let score = 0;
//     const isTouchDevice = breakpoint.width <= 768;
    
//     if (!isTouchDevice || this.checkMinTouchSize(buttons)) score += 25;
//     if (!isTouchDevice || this.checkMinTouchSize(links)) score += 25;
//     if (isTouchDevice || this.checkHoverStates(buttons)) score += 25;
//     if (this.checkFocusStates([...buttons, ...links])) score += 25;
    
//     return score;
//   }

//   private generateReport(): void {
//     Logger.log('\n📊 RESPONSIVE TEST REPORT');
//     Logger.log('========================');
    
//     let totalScore = 0;
//     let testCount = 0;
    
//     for (const [breakpointName, testData] of this.testResults) {
//       const { breakpoint, results } = testData;
      
//       Logger.log(`\n📱 ${breakpoint.description}`);
//       Logger.log(`   Navigation: ${results.navigation.score}/100`);
//       Logger.log(`   Game Canvas: ${results.gameCanvas.score}/100`);
//       Logger.log(`   Forms: ${results.forms.score}/100`);
//       Logger.log(`   Layout: ${results.layout.score}/100`);
//       Logger.log(`   Typography: ${results.typography.score}/100`);
//       Logger.log(`   Interactions: ${results.interactions.score}/100`);
      
//       const breakpointScore = (
//         results.navigation.score +
//         results.gameCanvas.score +
//         results.forms.score +
//         results.layout.score +
//         results.typography.score +
//         results.interactions.score
//       ) / 6;
      
//       Logger.log(`   📊 Overall: ${Math.round(breakpointScore)}/100`);
      
//       totalScore += breakpointScore;
//       testCount++;
//     }
    
//     const finalScore = Math.round(totalScore / testCount);
//     Logger.log(`\n🎯 FINAL RESPONSIVE SCORE: ${finalScore}/100`);
    
//     if (finalScore >= 90) {
//       Logger.log('✅ EXCELLENT responsive design!');
//     } else if (finalScore >= 75) {
//       Logger.log('✅ GOOD responsive design with minor issues');
//     } else if (finalScore >= 60) {
//       Logger.log('⚠️  FAIR responsive design - needs improvements');
//     } else {
//       Logger.log('❌ POOR responsive design - major fixes needed');
//     }
    
//     // Nettoyer l'overlay
//     const overlay = document.getElementById('responsive-test-overlay');
//     if (overlay) {
//       overlay.remove();
//     }
//   }

//   private delay(ms: number): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }

//   private checkNavigationAccessibility(): boolean {
//     const navLinks = document.querySelectorAll('nav a, nav button');
//     for (const link of navLinks) {
//       if (!link.getAttribute('aria-label') && !link.textContent?.trim()) {
//         return false;
//       }
//     }
//     return true;
//   }
// }