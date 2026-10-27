import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
import { fileURLToPath } from "node:url";
import type Database from "better-sqlite3";

// Charge better-sqlite3 dynamiquement, hors bundling Rollup.
// Indispensable car c'est une dépendance native (fichier .node).
const require = createRequire(import.meta.url);
const DatabaseCtor = require("better-sqlite3") as typeof Database;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  const dbPath = path.join(app.getPath("userData"), "flowmaster.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseCtor(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  console.log(`📁 Base ouverte : ${dbPath}`);
  return db;
}

function findMigrationsDir(): string {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  const candidates = [
    path.join(__dirname, "..", "electron", "db", "migrations"),
    path.join(__dirname, "db", "migrations"),
    resourcesPath ? path.join(resourcesPath, "migrations") : "",
    path.join(app.getAppPath(), "electron", "db", "migrations"),
    path.join(process.cwd(), "electron", "db", "migrations"),
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      console.log(`📂 Migrations trouvées dans : ${c}`);
      return c;
    }
  }
  throw new Error("Dossier de migrations introuvable. Chemins testés : " + candidates.join(" | "));
}

export function runMigrations(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now')),
      checksum   TEXT
    );
  `);

  const dir = findMigrationsDir();
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort();

  const appliedRows = database.prepare("SELECT version FROM schema_migrations").all() as {
    version: number;
  }[];
  const applied = new Set<number>(appliedRows.map((r) => r.version));

  let count = 0;
  for (const file of files) {
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    if (!match) continue;
    const version = parseInt(match[1], 10);
    const name = match[2];
    if (applied.has(version)) continue;

    const sql = fs.readFileSync(path.join(dir, file), "utf-8");
    const tx = database.transaction(() => {
      database.exec(sql);
      database
        .prepare("INSERT INTO schema_migrations (version, name) VALUES (?, ?)")
        .run(version, name);
    });
    tx();
    console.log(`✅ Migration appliquée : ${file}`);
    count++;
  }

  if (count === 0) {
    console.log("✅ Base à jour, aucune migration à appliquer.");
  }
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
