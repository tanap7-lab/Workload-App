import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDb } from './database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB
  initDb();

  app.use(express.json());

  // API Routes
  
  // Get all team members
  app.get('/api/team-members', (req, res) => {
    const members = db.prepare('SELECT * FROM team_members WHERE is_active = 1').all();
    res.json(members);
  });

  // Get current week or specific week
  app.get('/api/weeks/:year/:weekNumber', (req, res) => {
    const { year, weekNumber } = req.params;
    let week = db.prepare('SELECT * FROM weeks WHERE year = ? AND week_number = ?').get(year, weekNumber) as any;
    
    if (!week) {
      // Auto-create week if requested and not found
      const result = db.prepare('INSERT INTO weeks (year, week_number) VALUES (?, ?)').run(year, weekNumber);
      week = { id: result.lastInsertRowid, year: parseInt(year), week_number: parseInt(weekNumber) };
      
      // Optionally carry over tasks from previous week (simplified logic here)
    }
    
    const tasks = db.prepare('SELECT * FROM tasks WHERE week_id = ?').all(week.id);
    
    // Return members who are active OR have tasks in this specific week
    const members = db.prepare(`
      SELECT DISTINCT m.* FROM team_members m
      LEFT JOIN tasks t ON m.id = t.member_id AND t.week_id = ?
      WHERE m.is_active = 1 OR t.id IS NOT NULL
    `).all(week.id);

    res.json({ week, tasks, members });
  });

  // Update or create task
  app.post('/api/tasks', (req, res) => {
    const { week_id, member_id, priority, task_name, effort_hours } = req.body;
    
    const existing = db.prepare('SELECT id FROM tasks WHERE week_id = ? AND member_id = ? AND priority = ?').get(week_id, member_id, priority) as any;
    
    if (existing) {
      db.prepare('UPDATE tasks SET task_name = ?, effort_hours = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(task_name, effort_hours, existing.id);
      res.json({ status: 'updated', id: existing.id });
    } else {
      const result = db.prepare('INSERT INTO tasks (week_id, member_id, priority, task_name, effort_hours) VALUES (?, ?, ?, ?, ?)')
        .run(week_id, member_id, priority, task_name, effort_hours);
      res.json({ status: 'created', id: result.lastInsertRowid });
    }
  });

  // Carry over tasks from last year/week to current week (now rebranded as copy forward)
  app.post('/api/weeks/carry-over', (req, res) => {
    const { from_week_id, to_week_id } = req.body;
    
    // Get all tasks from source week
    const tasks = db.prepare('SELECT * FROM tasks WHERE week_id = ?').all(from_week_id) as any[];
    
    // Use an UPSERT-like approach if we have a unique constraint, but since we might not yet, 
    // we'll check for existence manually or use a transaction.
    const transaction = db.transaction((taskList) => {
      for (const task of taskList) {
        // Find existing task in target week for this member and priority
        const existing = db.prepare('SELECT id FROM tasks WHERE week_id = ? AND member_id = ? AND priority = ?')
          .get(to_week_id, task.member_id, task.priority) as any;
        
        if (existing) {
          db.prepare('UPDATE tasks SET task_name = ?, effort_hours = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(task.task_name, existing.id);
        } else {
          db.prepare('INSERT INTO tasks (week_id, member_id, priority, task_name, effort_hours) VALUES (?, ?, ?, ?, ?)')
            .run(to_week_id, task.member_id, task.priority, task.task_name, 0); // Default to 0 hours for new week
        }
      }
    });

    transaction(tasks);
    res.json({ status: 'success' });
  });

  // Update team member settings
  app.post('/api/team-members/:id', (req, res) => {
    const { id } = req.params;
    const { name, role, weekly_hours, avatar_url } = req.body;
    
    db.prepare('UPDATE team_members SET name = ?, role = ?, weekly_hours = ?, avatar_url = ? WHERE id = ?')
      .run(name, role, weekly_hours, avatar_url, id);
      
    res.json({ status: 'success' });
  });

  // Delete team member
  app.delete('/api/team-members/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
    res.json({ status: 'success' });
  });

  // Toggle team member active status
  app.post('/api/team-members/:id/toggle', (req, res) => {
    const { id } = req.params;
    const member = db.prepare('SELECT is_active FROM team_members WHERE id = ?').get(id) as any;
    if (member) {
      const newStatus = member.is_active === 1 ? 0 : 1;
      db.prepare('UPDATE team_members SET is_active = ? WHERE id = ?').run(newStatus, id);
      res.json({ status: 'success', active: newStatus });
    } else {
      res.status(404).json({ error: 'Member not found' });
    }
  });

  // Add new team member
  app.post('/api/team-members', (req, res) => {
    const { name, role, weekly_hours, avatar_color } = req.body;
    const result = db.prepare('INSERT INTO team_members (name, role, weekly_hours, avatar_color) VALUES (?, ?, ?, ?)')
      .run(name || 'New Member', role || 'Team Member', weekly_hours || 40, avatar_color || '#6366f1');
    res.json({ status: 'success', id: result.lastInsertRowid });
  });

  // Reorder tasks for a member in a week
  app.post('/api/tasks/reorder', (req, res) => {
    const { week_id, member_id, newOrder } = req.body;
    
    const transaction = db.transaction((updates) => {
      for (const update of updates) {
        db.prepare(`
          INSERT INTO tasks (week_id, member_id, priority, task_name, effort_hours)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(week_id, member_id, priority) DO UPDATE SET
            task_name = excluded.task_name,
            effort_hours = excluded.effort_hours,
            updated_at = CURRENT_TIMESTAMP
        `).run(week_id, member_id, update.priority, update.task_name, update.effort_hours);
      }
    });

    transaction(newOrder);
    res.json({ status: 'success' });
  });

  // Analytics: Get effort distribution for last 4 weeks for a member
  app.get('/api/analytics/trend/:memberId', (req, res) => {
    const { memberId } = req.params;
    const history = db.prepare(`
      SELECT w.week_number, w.year, t.priority, SUM(t.effort_hours) as effort
      FROM weeks w
      JOIN tasks t ON w.id = t.week_id
      WHERE t.member_id = ?
      GROUP BY w.year, w.week_number, t.priority
      ORDER BY w.year DESC, w.week_number DESC
      LIMIT 20
    `).all(memberId);
    res.json(history);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
