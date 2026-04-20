import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/team_effort.db' : join(process.cwd(), 'team_effort.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize Database Schema
 */
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT,
      avatar_color TEXT DEFAULT '#6366f1',
      avatar_url TEXT,
      weekly_hours REAL DEFAULT 40,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS weeks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_number INTEGER NOT NULL,
      year INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(week_number, year)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      priority TEXT NOT NULL, -- '1', '2', '3', '4', 'ALS'
      task_name TEXT NOT NULL,
      effort_hours REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
      UNIQUE(week_id, member_id, priority)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Seed default members if none exist
  const membersCount = db.prepare('SELECT count(*) as count FROM team_members').get() as { count: number };
  if (membersCount.count === 0) {
    const insertMember = db.prepare('INSERT INTO team_members (name, role, avatar_color) VALUES (?, ?, ?)');
    insertMember.run('Paul', 'Principal Engineer', '#6366f1');
    insertMember.run('Rishab', 'Senior Product Designer', '#10b981');
    insertMember.run('Rodrigo', 'Data Specialist', '#f59e0b');
    insertMember.run('Sophie', 'Team Operations', '#ef4444');
    
    // Seed initial data for Week 16, 2026 (or current year)
    const currentYear = new Date().getFullYear();
    const week16 = db.prepare('INSERT OR IGNORE INTO weeks (week_number, year) VALUES (?, ?)').run(16, currentYear);
    const weekId = week16.lastInsertRowid || (db.prepare('SELECT id FROM weeks WHERE week_number = ? AND year = ?').get(16, currentYear) as { id: number }).id;

    const paulId = 1;
    const rishabId = 2;
    const rodrigoId = 3;
    const sophieId = 4;

    const insertTask = db.prepare('INSERT INTO tasks (week_id, member_id, priority, task_name, effort_hours) VALUES (?, ?, ?, ?, ?)');
    
    // Paul
    insertTask.run(weekId, paulId, '1', 'SAT', 15);
    insertTask.run(weekId, paulId, '2', 'SFMS', 1);
    insertTask.run(weekId, paulId, '3', 'IATF follow up', 3);
    insertTask.run(weekId, paulId, '4', 'LPA Tool', 2);
    insertTask.run(weekId, paulId, 'ALS', 'Admin/Learning/Social', 10);

    // Rishab
    insertTask.run(weekId, rishabId, '1', 'Strat.Proj.2.2', 10);
    insertTask.run(weekId, rishabId, '2', 'Power Automate', 10);
    insertTask.run(weekId, rishabId, '3', 'Sorting Tool', 2);
    insertTask.run(weekId, rishabId, '4', 'CQTS', 3);
    insertTask.run(weekId, rishabId, 'ALS', 'Admin/Learning/Social', 10);

    // Rodrigo
    insertTask.run(weekId, rodrigoId, '1', 'Strat.Proj.2.2', 10);
    insertTask.run(weekId, rodrigoId, '2', 'Sorting Tool', 3);
    insertTask.run(weekId, rodrigoId, '3', 'DS & G', 2);
    insertTask.run(weekId, rodrigoId, '4', 'SFMS + SLT', 2);
    insertTask.run(weekId, rodrigoId, 'ALS', 'Admin/Learning/Social', 10);

    // Sophie
    insertTask.run(weekId, sophieId, '1', 'Strat.Proj.2.2', 15);
    insertTask.run(weekId, sophieId, '2', 'Safe Launch Tool', 1);
    insertTask.run(weekId, sophieId, '3', 'DQS communication', 3);
    insertTask.run(weekId, sophieId, '4', 'CFK-X and CQD', 3);
    insertTask.run(weekId, sophieId, 'ALS', 'Admin/Learning/Social', 10);
  }
}

export default db;
