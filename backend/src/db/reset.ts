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
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
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

    CREATE TABLE IF NOT EXISTS user_stats (
        user_id INTEGER PRIMARY KEY,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        total_games INTEGER DEFAULT 0,
        win_rate REAL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
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
    INSERT OR IGNORE INTO users (username, email, password, is_online, createdAt) VALUES 
    ('carti', 'carti@example.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 0, '2024-01-01 10:00:00'),
    ('kanye', 'kanye@example.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 0, '2024-01-02 11:00:00'),
    ('travis', 'travis@example.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 1, '2024-01-03 12:00:00'),
    ('future', 'future@test.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 0, '2024-01-04 13:00:00'),
    ('pnd', 'pnd@test.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 1, '2024-01-05 14:00:00');

    INSERT OR IGNORE INTO user_stats (user_id, wins, losses, total_games, win_rate) VALUES 
    (1, 5, 2, 7, 71.43),
    (2, 3, 4, 7, 42.86),
    (3, 10, 1, 11, 90.91),
    (4, 15, 3, 18, 83.33),
    (5, 8, 12, 20, 40.0);
`);

console.log("✅ Database reset complete!");
