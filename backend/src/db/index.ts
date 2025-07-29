import Database from "better-sqlite3";

const db = new Database("database.db", {verbose: console.log}); //affiche dans la console pour debug

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
`);


export default db;