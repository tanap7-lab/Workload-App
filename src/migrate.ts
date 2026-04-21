import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'team_effort.db');
const db = new Database(dbPath);

console.log('Running migration...');

try {
  db.prepare('ALTER TABLE tasks ADD COLUMN category_abbr TEXT').run();
  console.log('Added category_abbr to tasks table.');
} catch (e) {}

try {
  db.prepare('ALTER TABLE categories ADD COLUMN color TEXT DEFAULT "#6366f1"').run();
  db.prepare('ALTER TABLE categories ADD COLUMN priority_level INTEGER DEFAULT 3').run();
  console.log('Added color and priority_level to categories table.');
} catch (e) {}

// Add missing categories and map tasks
const insertCat = db.prepare('INSERT OR IGNORE INTO categories (abbreviation, fullName, color, priority_level) VALUES (?, ?, ?, ?)');
insertCat.run('SAT', 'System Acceptance Testing', '#EF4444', 1);
insertCat.run('SFMS', 'Smart Factory Management System', '#F97316', 2);
insertCat.run('IATF', 'International Automotive Task Force', '#F59E0B', 1);
insertCat.run('CQTS', 'Customer Quality Tracking System', '#10B981', 3);
insertCat.run('LPA', 'Layered Process Audit', '#3B82F6', 4);
insertCat.run('PROJECT', 'General Project Work', '#8B5CF6', 2);
insertCat.run('TOOL', 'Tool Development', '#EC4899', 3);
insertCat.run('ALS', 'Admin/Learning/Social', '#64748B', 5);

const updateTask = db.prepare('UPDATE tasks SET category_abbr = ? WHERE task_name LIKE ?');
updateTask.run('SAT', '%SAT%');
updateTask.run('SFMS', '%SFMS%');
updateTask.run('IATF', '%IATF%');
updateTask.run('PROJECT', '%Strat.Proj%');
updateTask.run('TOOL', '%Tool%');
updateTask.run('ALS', '%ALS%');

console.log('Migration complete!');
db.close();
