import Database from "better-sqlite3";

const db = new Database("database.db", {verbose: console.log});

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        avatar_url TEXT,
        is_online INTEGER NOT NULL DEFAULT 0,
        last_login TEXT,
        google_id TEXT,
        two_factor_enabled INTEGER NOT NULL DEFAULT 0
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
        tournament_match_number INTEGER, -- de 1 a 7 pour reperer quel match c'etait
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
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
        UNIQUE(match_id, user_id, alias)
    );

    CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT CHECK(status IN ('waiting', 'in_progress', 'completed')) DEFAULT 'waiting',
        participants TEXT NOT NULL, -- JSON des 8 participants shufflés dans l'ordre
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        match_played INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS two_factor_tokens (
        user_id INTEGER PRIMARY KEY,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
`);

// ✅ Fonction IDENTIQUE à reset.ts
function insertTestDataIfNotExists() {
    // Vérifier si les données de test existent déjà
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    
    if (userCount.count === 0) {
        console.log("🔧 Inserting test data...");
        
        db.exec(`
            -- ============================================
            -- DONNÉES DE TEST - IDENTIQUES À reset.ts
            -- ============================================
            INSERT OR IGNORE INTO users (username, email, password, is_online, created_at, avatar_url) VALUES 
            ('carti', 'carti@example.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 0, '2024-01-01 10:00:00', '/uploads/avatars/carti.jpeg'),
            ('kanye', 'kanye@example.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 0, '2024-01-02 11:00:00', '/uploads/avatars/kanye.jpeg'),
            ('travis', 'travis@example.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 1, '2024-01-03 12:00:00', '/uploads/avatars/travis.jpeg' ),
            ('future', 'future@test.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 0, '2024-01-04 13:00:00', '/uploads/avatars/future.jpeg'),
            ('pnd', 'pnd@test.com', '$2b$10$kC7jopUFsc6nxCbTK9rXx.JtL41o89.TmmyBum9NVIo3ZfTw7plfe', 1, '2024-01-05 14:00:00', '/uploads/avatars/pnd.jpeg');

            -- 🆕 Données IDENTIQUES à reset.ts
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

            -- 🆕 Participants IDENTIQUES à reset.ts
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
        
        console.log("✅ Test data inserted successfully!");
    } else {
        console.log("ℹ️  Test data already exists, skipping insertion.");
    }
}

// ✅ Insérer les données de test seulement si nécessaire
insertTestDataIfNotExists();

export default db;