import db from "./index.js";

console.log("♻️ Resetting database...");

// Supprimer toutes les données
db.exec("DROP TABLE IF EXISTS users;");

// Recréer les tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log("✅ Database reset complete!");
