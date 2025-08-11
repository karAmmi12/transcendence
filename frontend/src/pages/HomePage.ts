// export class HomePage {
//   mount(selector: string): void {
//     const element = document.querySelector(selector)
//     if (!element) return

//     element.innerHTML = `
//       <div class="text-center">
//         <h1 class="text-6xl font-game font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
//           Welcome to ft_transcendence
//         </h1>
        
//         <p class="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
//           Experience the ultimate Pong game with real-time multiplayer, 
//           tournaments, and an immersive gaming experience.
//         </p>
        
//         <div class="grid md:grid-cols-3 gap-8 mb-12">
//           <div class="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
//             <div class="text-4xl mb-4">🏓</div>
//             <h3 class="text-xl font-semibold mb-2">Real-time Multiplayer</h3>
//             <p class="text-gray-400">Play against friends in real-time from anywhere in the world</p>
//           </div>
          
//           <div class="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
//             <div class="text-4xl mb-4">🏆</div>
//             <h3 class="text-xl font-semibold mb-2">Tournaments</h3>
//             <p class="text-gray-400">Compete in tournaments and climb the leaderboard</p>
//           </div>
          
//           <div class="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
//             <div class="text-4xl mb-4">💬</div>
//             <h3 class="text-xl font-semibold mb-2">Live Chat</h3>
//             <p class="text-gray-400">Chat with other players and make new friends</p>
//           </div>
//         </div>
        
//         <div class="space-x-4">
//           <button id="play-btn" class="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
//             Start Playing
//           </button>
//           <button id="login-btn" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
//             Login
//           </button>
//         </div>
//       </div>
//     `

//     this.bindEvents()
//   }

//   private bindEvents(): void {
//     document.getElementById('play-btn')?.addEventListener('click', () => {
//       window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }))
//     })

//     document.getElementById('login-btn')?.addEventListener('click', () => {
//       window.dispatchEvent(new CustomEvent('navigate', { detail: '/login' }))
//     })
//   }

//   destroy(): void {
//     // Cleanup if needed
//   }
// }

import { i18n } from '@services/i18n';

export class HomePage {

    private languageListener: (() => void) | null = null;

    mount(selector: string): void {
        const element = document.querySelector(selector);
        if (!element) return;

        this.render(element);

        // Nettoie l'ancien listener si besoin
        this.destroy();

        // Ajoute le listener pour le changement de langue
        this.languageListener = () => {
            this.render(element);
            this.bindEvents();
        };
        window.addEventListener('languageChanged', this.languageListener);
        this.bindEvents();
    }

    private render(element: Element): void {
        element.innerHTML = `
            <div class="text-center">
                <h1 class="text-6xl font-game font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    ${i18n.t('home.welcome')}
                </h1>
                
                <p class="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                    ${i18n.t('home.description')}
                </p>

                <div class="grid md:grid-cols-4 gap-8 mb-12">
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                        <div class="text-4xl mb-4">🏓</div>
                        <h3 class="text-xl font-semibold mb-2">${i18n.t('home.features.multiplayer.title')}</h3>
                        <p class="text-gray-400">${i18n.t('home.features.multiplayer.description')}</p>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                        <div class="text-4xl mb-4">🎮</div>
                        <h3 class="text-xl font-semibold mb-2">${i18n.t('home.features.singleplayer.title')}</h3>
                        <p class="text-gray-400">${i18n.t('home.features.singleplayer.description')}</p>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                        <div class="text-4xl mb-4">🏆</div>
                        <h3 class="text-xl font-semibold mb-2">${i18n.t('home.features.tournaments.title')}</h3>
                        <p class="text-gray-400">${i18n.t('home.features.tournaments.description')}</p>
                    </div>

                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                        <div class="text-4xl mb-4">💬</div>
                        <h3 class="text-xl font-semibold mb-2">${i18n.t('home.features.chat.title')}</h3>
                        <p class="text-gray-400">${i18n.t('home.features.chat.description')}</p>
                    </div>
                </div>

                <div class="space-x-4">
                    <button id="play-btn" class="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">
                        ${i18n.t('home.buttons.play')}
                    </button>
                    <button id="login-btn" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">
                        ${i18n.t('home.buttons.login')}
                    </button>
                </div>

                
            </div>
        `;
    }

    private bindEvents(): void {
        document.getElementById('play-btn')?.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
        });

        document.getElementById('login-btn')?.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: '/login' }));
        });
    }

    destroy(): void {
        // Cleanup if needed
        if (this.languageListener) {
            window.removeEventListener('languageChanged', this.languageListener);
            this.languageListener = null;
        }
    }
}