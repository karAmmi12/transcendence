import db from "./index.js";

console.log("♻️ Resetting database...");

// Supprimer toutes les données
db.exec("DROP TABLE IF EXISTS users;");

// Recréer les tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        avatar_url TEXT,
        is_online INTEGER NOT NULL DEFAULT 0,
        lastLogin TEXT,
        googleId TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        refresh_token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, friend_id)
    );

    CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mode TEXT NOT NULL, -- 'local', 'remote', 'tournament'
        tournament_id INTEGER, -- NULL si pas tournoi
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        winner_id INTEGER, -- NULL si pas de user connecté ou si invité
        FOREIGN KEY (winner_id) REFERENCES users (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS match_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        user_id INTEGER,       -- NULL si invité
        alias TEXT,            -- utilisé si user_id est NULL
        score INTEGER NOT NULL DEFAULT 0,
        is_winner INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    );

    -- ============================================
    -- SIUU DONNÉES DE TEST - À COMMENTER PLUS TARD
    -- ============================================
    INSERT OR IGNORE INTO users (username, email, password, is_online, created_at) VALUES 
    ('carti', 'carti@example.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 0, '2024-01-01 10:00:00'),
    ('kanye', 'kanye@example.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 0, '2024-01-02 11:00:00'),
    ('travis', 'travis@example.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 1, '2024-01-03 12:00:00'),
    ('future', 'future@test.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 0, '2024-01-04 13:00:00'),
    ('pnd', 'pnd@test.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 1, '2024-01-05 14:00:00');

    -- 🆕 Données de test pour les matches
    INSERT OR IGNORE INTO matches (id, mode, tournament_id, started_at, ended_at, winner_id) VALUES 
    -- Matches remote entre utilisateurs
    (1, 'remote', NULL, '2024-01-15 10:00:00', '2024-01-15 10:05:00', 1), -- carti gagne
    (2, 'remote', NULL, '2024-01-16 14:00:00', '2024-01-16 14:07:00', 3), -- travis gagne
    (3, 'remote', NULL, '2024-01-17 16:00:00', '2024-01-17 16:04:00', 2), -- kanye gagne
    (4, 'remote', NULL, '2024-01-18 18:00:00', '2024-01-18 18:06:00', 4), -- future gagne
    (5, 'remote', NULL, '2024-01-19 20:00:00', '2024-01-19 20:03:00', 1), -- carti gagne

    -- Matches locaux (pas de winner_id car joueurs invités)
    (6, 'local', NULL, '2024-01-20 10:00:00', '2024-01-20 10:05:00', NULL),
    (7, 'local', NULL, '2024-01-21 14:00:00', '2024-01-21 14:07:00', NULL),

    -- Match en cours
    (8, 'remote', NULL, '2024-01-28 20:00:00', NULL, NULL);

    -- 🆕 Participants aux matches
    INSERT OR IGNORE INTO match_participants (match_id, user_id, alias, score, is_winner) VALUES 
    -- Match 1: carti vs kanye (carti gagne 5-3)
    (1, 1, NULL, 5, 1), -- carti gagne
    (1, 2, NULL, 3, 0), -- kanye perd

    -- Match 2: travis vs future (travis gagne 5-2)
    (2, 3, NULL, 5, 1), -- travis gagne
    (2, 4, NULL, 2, 0), -- future perd

    -- Match 3: kanye vs pnd (kanye gagne 5-4)
    (3, 2, NULL, 5, 1), -- kanye gagne
    (3, 5, NULL, 4, 0), -- pnd perd

    -- Match 4: future vs carti (future gagne 5-1)
    (4, 4, NULL, 5, 1), -- future gagne
    (4, 1, NULL, 1, 0), -- carti perd

    -- Match 5: carti vs travis (carti gagne 5-3)
    (5, 1, NULL, 5, 1), -- carti gagne
    (5, 3, NULL, 3, 0), -- travis perd

    -- Match 6 (local): Guest vs Guest
    (6, NULL, 'Player1', 5, 1), -- Player1 gagne
    (6, NULL, 'Player2', 3, 0), -- Player2 perd

    -- Match 7 (local): Guest vs Guest
    (7, NULL, 'Alice', 2, 0),   -- Alice perd
    (7, NULL, 'Bob', 5, 1),     -- Bob gagne

    -- Match 8 (en cours): carti vs pnd
    (8, 1, NULL, 2, 0), -- Score temporaire
    (8, 5, NULL, 1, 0); -- Score temporaire
`);

console.log("✅ Database reset complete!");
