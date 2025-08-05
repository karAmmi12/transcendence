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
    is_online INTEGER NOT NULL DEFAULT 0
  );
`);

console.log("✅ Database reset complete!");
