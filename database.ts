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
      category_abbr TEXT,
      effort_hours REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
      UNIQUE(week_id, member_id, priority)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      abbreviation TEXT NOT NULL UNIQUE,
      fullName TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      priority_level INTEGER DEFAULT 3
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Seed default categories if none exist
  const categoriesCount = db.prepare('SELECT count(*) as count FROM categories').get() as { count: number };
  if (categoriesCount.count === 0) {
    const insertCategory = db.prepare('INSERT INTO categories (abbreviation, fullName, color, priority_level) VALUES (?, ?, ?, ?)');
    insertCategory.run('SAT', 'System Acceptance Testing', '#EF4444', 1);
    insertCategory.run('SFMS', 'Smart Factory Management System', '#F97316', 2);
    insertCategory.run('IATF', 'International Automotive Task Force', '#F59E0B', 1);
    insertCategory.run('CQTS', 'Customer Quality Tracking System', '#10B981', 3);
    insertCategory.run('LPA', 'Layered Process Audit', '#3B82F6', 4);
    insertCategory.run('PROJECT', 'General Project Work', '#8B5CF6', 2);
    insertCategory.run('TOOL', 'Tool Development', '#EC4899', 3);
    insertCategory.run('ALS', 'Admin/Learning/Social', '#64748B', 5);
  }

  // Seed default members if none exist
  const membersCount = db.prepare('SELECT count(*) as count FROM team_members').get() as { count: number };
  if (membersCount.count === 0) {
    const insertMember = db.prepare('INSERT INTO team_members (name, role, avatar_color) VALUES (?, ?, ?)');
    insertMember.run('Paul', 'Principal Engineer', '#6366f1');
    insertMember.run('Rishab', 'Senior Product Designer', '#10b981');
    insertMember.run('Rodrigo', 'Data Specialist', '#f59e0b');
    insertMember.run('Sophie', 'Team Operations', '#ef4444');

    // Seed initial data for Week 17, 2026
    const currentYear = new Date().getFullYear();
    const week17 = db.prepare('INSERT OR IGNORE INTO weeks (week_number, year) VALUES (?, ?)').run(17, currentYear);
    const weekId = week17.lastInsertRowid || (db.prepare('SELECT id FROM weeks WHERE week_number = ? AND year = ?').get(17, currentYear) as { id: number }).id;

    const paulId = 1;
    const rishabId = 2;
    const rodrigoId = 3;
    const sophieId = 4;
    const projectCat = 'PROJECT';
    const toolCat = 'TOOL';

    const insertTask = db.prepare('INSERT INTO tasks (week_id, member_id, priority, task_name, category_abbr, effort_hours) VALUES (?, ?, ?, ?, ?, ?)');
    
    // Paul
    insertTask.run(weekId, paulId, '1', 'SAT', 'SAT', 15);
    insertTask.run(weekId, paulId, '2', 'SFMS', 'SFMS', 1);
    insertTask.run(weekId, paulId, '3', 'IATF follow up', 'IATF', 3);
    insertTask.run(weekId, paulId, '4', 'LPA Tool', 'LPA', 2);
    insertTask.run(weekId, paulId, 'ALS', 'Admin/Learning/Social', 'ALS', 10);

    // Rishab
    insertTask.run(weekId, rishabId, '1', 'Strat.Proj.2.2', projectCat, 10);
    insertTask.run(weekId, rishabId, '2', 'Power Automate', toolCat, 10);
    insertTask.run(weekId, rishabId, '3', 'Sorting Tool', toolCat, 2);
    insertTask.run(weekId, rishabId, '4', 'CQTS', 'CQTS', 3);
    insertTask.run(weekId, rishabId, 'ALS', 'Admin/Learning/Social', 'ALS', 10);

    // Rodrigo
    insertTask.run(weekId, rodrigoId, '1', 'Strat.Proj.2.2', projectCat, 10);
    insertTask.run(weekId, rodrigoId, '2', 'Sorting Tool', toolCat, 3);
    insertTask.run(weekId, rodrigoId, '3', 'DS & G', projectCat, 2);
    insertTask.run(weekId, rodrigoId, '4', 'SFMS + SLT', 'SFMS', 2);
    insertTask.run(weekId, rodrigoId, 'ALS', 'Admin/Learning/Social', 'ALS', 10);

    // Sophie
    insertTask.run(weekId, sophieId, '1', 'Strat.Proj.2.2', projectCat, 15);
    insertTask.run(weekId, sophieId, '2', 'Safe Launch Tool', toolCat, 1);
    insertTask.run(weekId, sophieId, '3', 'DQS communication', projectCat, 3);
    insertTask.run(weekId, sophieId, '4', 'CFK-X and CQD', projectCat, 3);
    insertTask.run(weekId, sophieId, 'ALS', 'Admin/Learning/Social', 'ALS', 10);
  }
}

export default db;
