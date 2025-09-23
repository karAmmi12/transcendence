✅ Objectif confirmé : 125% = 19 points
Modules choisis :
Domaine	        Module	    Type	                Points

Web	            Backend avec Fastify	            MAJ	2 ✅
                Frontend avec Tailwind CSS	        MIN	1 ✅
                SQLite	                            MIN	1 ✅
User Mgmt	    Auth classique (email + password)	MAJ	2 ✅
                Auth Google (OAuth)	                MAJ	2 ✅
Gameplay	    Joueurs distants (remote players)	MAJ	2 ✅
                Customisation du jeu	            MIN	1 ✅
AI / Stats	    Dashboard statistiques utilisateur	MIN	1 ✅
Cybersecurity   JWT + 2FA	                        MAJ	2 ✅
Accessibility	Support tous appareils (responsive)	MIN	1 ✅
                Compatibilité navigateurs étendue	MIN	1 ✅
                Support multilingue	                MIN	1 ✅
Graphics        Use advanced 3D techniques          MAJ 2 ✅

Total           =                                 19 points ✅

Techno utilise:
    - Tailwind CSS
    - Fastify avec Node.js
    - SQLite
    - OAuth 2.0
    - Babylon.js

Outils Backend :
    - bcrypt : Hachage sécurisé des mots de passe pour protéger les données utilisateur contre les attaques.
    - better-sqlite3 : Pilote SQLite optimisé pour exécuter des requêtes SQL préparées et gérer la base de données efficacement.
    - dotenv : Chargement des variables d'environnement (clés API, secrets) depuis des fichiers sécurisés pour la configuration.
    - jsonwebtoken : Génération et validation de tokens JWT pour l'authentification stateless et la gestion des sessions.
    - nodemailer : Envoi d'emails pour l'authentification à deux facteurs (2FA) et les notifications.
    - node-cron : Planification de tâches automatiques, comme le nettoyage périodique des tokens expirés.
    - ws : Gestion des connexions WebSocket pour les parties multijoueurs en temps réel et le matchmaking.
    - tsx : Non utilisé en production (seulement en dev pour exécuter TypeScript directement).

Outils Frontend :
    - eslint : Linting du code JavaScript/TypeScript pour détecter et corriger les erreurs, améliorant la qualité et la maintenabilité.
    - tailwindcss : Compilation des classes CSS utilitaires en styles optimisés pour la production.
    - typescript : Compilation du code TypeScript en JavaScript compatible avec les navigateurs, ajoutant la sécurité des types.
    - vite : Build tool pour bundler et optimiser les assets (JS, CSS, images) en un package de production servi par nginx.


SUJET:

• Major module: Use a framework to build the backend.
    In this major module, you are required to use a specific web framework for backend
    development: Fastify with Node.js .
    You can create the backend without using the constraints of this
    module by using the default backend language (as specified above in
    the mandatory part). However, this module will only be valid if you
    follow its requirements.

• Minor module: Use a framework or toolkit to build the front-end.
    Your frontend development must use the Tailwind CSS in addition of the Typescript, and nothing else.
    You can create a front-end without using the constraints of this
    module by using the default front-end directives (as specified above
    in the mandatory part). However, this module will only be valid if
    you follow its requirements.

• Minor module: Use a database for the backend -and more.
    The designated database for all DB instances in your project is SQLite This choice
    ensure data consistency and compatibility across all project components and may
    be a prerequisite for other modules, such as the backend Framework module.

• Major module: Standard user management, authentication and users across tournaments.
    ◦ Users can securely subscribe to the website.
    ◦ Registered users can securely log in.
    ◦ Users can select a unique display name to participate in tournaments.
    ◦ Users can update their information.
    ◦ Users can upload an avatar, with a default option if none is provided.
    ◦ Users can add others as friends and view their online status.
    ◦ User profiles display stats, such as wins and losses.
    ◦ Each user has a Match History including 1v1 games, dates, and relevant
    details, accessible to logged-in users.
    The management of duplicate usernames/emails is at your discretion;
    please ensure a logical solution is provided.

• Major module: Implement remote authentication.
    In this major module, the goal is to implement a secure external authentication
    system using OAuth 2.0 .
    • You are free to choose any OAuth-compatible provider (e.g., Google,
    GitHub, etc.).
    14
    ft_transcendence Surprise.
    Key features and objectives include:
    ◦ Integrate the authentication system, allowing users to securely sign in.
    ◦ Obtain the necessary credentials and permissions from the authority to enable
    secure login.
    ◦ Implement user-friendly login and authorization flows that adhere to best practices and security standards.
    ◦ Ensure the secure exchange of authentication tokens and user information
    between the web application and the authentication provider.
    This major module aims to provide a remote user authentication, offering users a
    secure and convenient way to access the web application.

• Major module: Remote players
    It should be possible for two players to play remotely. Each player is located on a
    separated computer, accessing the same website and playing the same Pong game.
    Consider network issues, such as unexpected disconnections or lag.
    You must offer the best user experience possible.

• Minor module: Game customization options.
    In this minor module, the goal is to provide customization options for all available
    games on the platform. Key features and objectives include:
    ◦ Offer customization features, such as power-ups, attacks, or different maps,
    that enhance the gameplay experience.
    ◦ Allow users to choose a default version of the game with basic features if they
    prefer a simpler experience.
    ◦ Ensure that customization options are available and applicable to all games
    offered on the platform.
    ◦ Implement user-friendly settings menus or interfaces for adjusting game parameters.
    ◦ Maintain consistency in customization features across all games to provide a
    unified user experience.
    This module aims to give users the flexibility to tailor their gaming experience
    across all available games by providing a variety of customization options while
    also offering a default version for those who prefer a straightforward gameplay
    experience.

• Minor module: User and Game Stats Dashboards.
    In this minor module, the goal is to introduce dashboards that display statistics for
    individual users and game sessions. Key features and objectives include:
    ◦ Create user-friendly dashboards that provide users with insights into their
    gaming statistics.
    ◦ Develop a separate dashboard for game sessions, showing detailed statistics,
    outcomes, and historical data for each match.
    ◦ Ensure that the dashboards offer an intuitive and informative user interface
    for tracking and analyzing data.
    ◦ Implement data visualization techniques, such as charts and graphs, to present
    statistics in a clear and visually appealing manner.
    ◦ Allow users to access and explore their own gaming history and performance
    metrics conveniently.
    ◦ Feel free to add any metrics you deem useful.
    This minor module aims to empower users with the ability to monitor their gaming
    statistics and game session details through user-friendly dashboards, providing a
    comprehensive view of their gaming experience.

• Major module: Implement Two-Factor Authentication (2FA) and JWT.
    The goal of this major module is to enhance security and user authentication
    by introducing Two-Factor Authentication (2FA) and utilizing JSON Web Tokens
    (JWT). Key features and objectives include:
    ◦ Implement Two-Factor Authentication (2FA) as an additional layer of security
    for user accounts, requiring users to provide a secondary verification method,
    such as a one-time code, in addition to their password.
    ◦ Utilize JSON Web Tokens (JWT) as a secure method for authentication and
    authorization, ensuring that user sessions and access to resources are managed 
    securely.
    ◦ Provide a user-friendly setup process for enabling 2FA, with options for SMS
    codes, authenticator apps, or email-based verification.
    ◦ Ensure that JWT tokens are issued and validated securely to prevent unauthorized access to user accounts and sensitive data.
    This major module aims to strengthen user account security by offering Two-Factor
    Authentication (2FA) and enhancing authentication and authorization through the
    use of JSON Web Tokens (JWT).

• Major module: Implementing Advanced 3D Techniques
    This major module,"Graphics," focuses on enhancing the visual aspects of the Pong
    game. It introduces the use of advanced 3D techniques to create a more immersive
    gaming experience. Specifically, the Pong game will be developed using Babylon.js
    to achieve the desired visual effects.
    ◦ Advanced 3D Graphics: The primary goal of this module is to implement
    advanced 3D graphics techniques to elevate the visual quality of the Pong
    game. By utilizing Babylon.js , the goal is to create stunning visual effects
    that immerse players in the gaming environment.
    ◦ Immersive Gameplay: The incorporation of advanced 3D techniques enhances
    the overall gameplay experience by providing users with a visually engaging
    and captivating Pong game.
    ◦ Technology Integration: The chosen technology for this module is Babylon.js .
    These tools will be used to create the 3D graphics, ensuring compatibility and
    optimal performance.
    This major module aims to revolutionize the Pong game’s visual elements by introducing advanced 3D techniques. Through the use of Babylon.js , we aim to provide
    players with an immersive and visually stunning gaming experience.

• Minor module: Support on all devices.
    In this module, the main focus is to ensure that your website works seamlessly on
    all types of devices. Key features and objectives include:
    ◦ Ensure the website is responsive, adapting to different screen sizes and orientations, providing a consistent user experience on desktops, laptops, tablets,
    and smartphones.
    ◦ Ensure that users can easily navigate and interact with the website using
    different input methods, such as touchscreens, keyboards, and mice, depending
    on the device they are using.
    This module aims to provide a consistent and user-friendly experience on all devices,
    maximizing accessibility and user satisfaction.

• Minor module: Expanding Browser Compatibility.
    In this minor module, the objective is to enhance the compatibility of the web
    application by adding support for an additional web browser. Key features and
    objectives include:
    ◦ Extend browser support to include an additional web browser, ensuring that
    users can access and use the application seamlessly.
    ◦ Conduct thorough testing and optimization to ensure that the web application
    functions correctly and displays correctly in the newly supported browser.
    ◦ Address any compatibility issues or rendering discrepancies that may arise in
    the added web browser.
    ◦ Ensure a consistent user experience across all supported browsers, maintaining
    usability and functionality.
    This minor module aims to broaden the accessibility of the web application by
    supporting an additional web browser, providing users with more choices for their
    browsing experience.

• Minor module: Multiple language support.
    In this minor module, the objective is to ensure that your website supports multiple
    languages to cater to a diverse user base. Key features and goals include:
    ◦ Implement support for a minimum of three languages on the website to accommodate a broad audience.
    ◦ Provide a language switcher or selector that allows users to easily change the
    website’s language based on their preferences.
    ◦ Translate essential website content, such as navigation menus, headings, and
    key information, into the supported languages.
    ◦ Ensure that users can navigate and interact with the website seamlessly, regardless of the selected language.
    ◦ Consider using language packs or localization libraries to simplify the translation process and maintain consistency across different languages.
    ◦ Allow users to set their preferred language as the default for subsequent visits.
    This minor module aims to enhance the accessibility and inclusivity of your website
    by offering content in multiple languages, making it more user-friendly for a diverse
    international audience.