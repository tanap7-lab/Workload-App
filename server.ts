import express from 'express';
import { chromium } from 'playwright';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDb } from './database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  initDb();
  app.use(express.json());

  // ─── PDF Export ───────────────────────────────────────────────────────────
  app.post('/api/pdf/export', async (req, res) => {
    const { url, filename } = req.body;
    console.log(`Generating PDF for: ${url}`);
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 2 });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.addStyleTag({
        content: `
          header, aside, footer, #export-modal-root, [role="dialog"], .fixed, .absolute { display: none !important; }
          body { background: white !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
          #report-container { width: 1200px !important; min-width: 1200px !important; max-width: 1200px !important; padding: 0px !important; margin: 0 auto !important; box-shadow: none !important; }
          main { padding: 0 !important; margin: 0 !important; overflow: visible !important; }
          .pdf-page-section, .bento-card { break-inside: avoid !important; page-break-inside: avoid !important; margin-bottom: 20px !important; }
        `
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      const pdfBuffer = await page.pdf({ format: 'A4', landscape: true, printBackground: true, scale: 0.8, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } });
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename || 'report.pdf'}`);
      res.send(pdfBuffer);
      console.log('  ✅ PDF Export Complete');
    } catch (error) {
      console.error('  ❌ PDF Generation Error:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    } finally {
      await browser.close();
    }
  });

  // ─── Team Members ─────────────────────────────────────────────────────────
  app.get('/api/team-members', (req, res) => {
    res.json(db.prepare('SELECT * FROM team_members WHERE is_active = 1').all());
  });

  app.post('/api/team-members', (req, res) => {
    const { name, role, weekly_hours, avatar_color } = req.body;
    const result = db.prepare('INSERT INTO team_members (name, role, weekly_hours, avatar_color) VALUES (?, ?, ?, ?)').run(name, role, weekly_hours, avatar_color);
    res.json({ status: 'created', id: result.lastInsertRowid });
  });

  app.post('/api/team-members/:id', (req, res) => {
    const { id } = req.params;
    const fields = req.body as Record<string, any>;
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE team_members SET ${sets} WHERE id = ?`).run(...Object.values(fields), id);
    res.json({ status: 'updated' });
  });

  app.post('/api/team-members/:id/toggle', (req, res) => {
    db.prepare('UPDATE team_members SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(req.params.id);
    res.json({ status: 'toggled' });
  });

  // ─── Weeks & Tasks ────────────────────────────────────────────────────────
  app.get('/api/weeks/:year/:weekNumber', (req, res) => {
    const { year, weekNumber } = req.params;
    let week = db.prepare('SELECT * FROM weeks WHERE year = ? AND week_number = ?').get(year, weekNumber) as any;
    if (!week) {
      const result = db.prepare('INSERT INTO weeks (year, week_number) VALUES (?, ?)').run(year, weekNumber);
      week = { id: result.lastInsertRowid, year: parseInt(year), week_number: parseInt(weekNumber) };
    }
    const tasks = db.prepare('SELECT * FROM tasks WHERE week_id = ?').all(week.id);
    const members = db.prepare(`
      SELECT DISTINCT m.* FROM team_members m
      LEFT JOIN tasks t ON m.id = t.member_id AND t.week_id = ?
      WHERE m.is_active = 1 OR t.id IS NOT NULL
    `).all(week.id);
    res.json({ week, tasks, members });
  });

  app.post('/api/tasks', (req, res) => {
    const { week_id, member_id, priority, task_name, category_abbr, effort_hours } = req.body;
    const existing = db.prepare('SELECT id FROM tasks WHERE week_id = ? AND member_id = ? AND priority = ?').get(week_id, member_id, priority) as any;
    if (existing) {
      db.prepare('UPDATE tasks SET task_name = ?, category_abbr = ?, effort_hours = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(task_name, category_abbr, effort_hours, existing.id);
      res.json({ status: 'updated', id: existing.id });
    } else {
      const result = db.prepare('INSERT INTO tasks (week_id, member_id, priority, task_name, category_abbr, effort_hours) VALUES (?, ?, ?, ?, ?, ?)').run(week_id, member_id, priority, task_name, category_abbr, effort_hours);
      res.json({ status: 'created', id: result.lastInsertRowid });
    }
  });

  app.post('/api/tasks/reorder', (req, res) => {
    const { week_id, member_id, newOrder } = req.body;
    const transaction = db.transaction((updates: any[]) => {
      for (const update of updates) {
        db.prepare(`
          INSERT INTO tasks (week_id, member_id, priority, task_name, category_abbr, effort_hours)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(week_id, member_id, priority) DO UPDATE SET
            task_name = excluded.task_name, category_abbr = excluded.category_abbr,
            effort_hours = excluded.effort_hours, updated_at = CURRENT_TIMESTAMP
        `).run(week_id, member_id, update.priority, update.task_name, update.category_abbr, update.effort_hours);
      }
    });
    transaction(newOrder);
    res.json({ status: 'success' });
  });

  app.post('/api/weeks/carry-over', (req, res) => {
    const { from_week_id, to_week_id } = req.body;
    const tasks = db.prepare('SELECT * FROM tasks WHERE week_id = ?').all(from_week_id) as any[];
    const transaction = db.transaction((taskList: any[]) => {
      for (const task of taskList) {
        const existing = db.prepare('SELECT id FROM tasks WHERE week_id = ? AND member_id = ? AND priority = ?').get(to_week_id, task.member_id, task.priority) as any;
        if (existing) {
          db.prepare('UPDATE tasks SET task_name = ?, category_abbr = ?, effort_hours = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(task.task_name, task.category_abbr, existing.id);
        } else {
          db.prepare('INSERT INTO tasks (week_id, member_id, priority, task_name, category_abbr, effort_hours) VALUES (?, ?, ?, ?, ?, ?)').run(to_week_id, task.member_id, task.priority, task.task_name, task.category_abbr, 0);
        }
      }
    });
    transaction(tasks);
    res.json({ status: 'success' });
  });

  // ─── Categories ───────────────────────────────────────────────────────────
  app.get('/api/categories', (req, res) => {
    res.json(db.prepare('SELECT * FROM categories ORDER BY abbreviation ASC').all());
  });

  app.post('/api/categories', (req, res) => {
    const { id, abbreviation, fullName, color, priority_level } = req.body;
    try {
      if (id) {
        const old = db.prepare('SELECT abbreviation FROM categories WHERE id = ?').get(id) as any;
        db.prepare('UPDATE categories SET abbreviation = ?, fullName = ?, color = ?, priority_level = ? WHERE id = ?')
          .run(abbreviation, fullName, color, priority_level, id);
        if (old && old.abbreviation !== abbreviation) {
          db.prepare('UPDATE tasks SET category_abbr = ? WHERE category_abbr = ?').run(abbreviation, old.abbreviation);
        }
        res.json({ status: 'success', id });
      } else {
        const result = db.prepare(`
          INSERT INTO categories (abbreviation, fullName, color, priority_level) VALUES (?, ?, ?, ?)
          ON CONFLICT(abbreviation) DO UPDATE SET fullName = excluded.fullName, color = excluded.color, priority_level = excluded.priority_level
        `).run(abbreviation, fullName, color, priority_level);
        res.json({ status: 'success', id: result.lastInsertRowid });
      }
    } catch (err) {
      console.error('Category save error:', err);
      res.status(500).json({ error: 'Failed to save category' });
    }
  });

  app.delete('/api/categories/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
      res.json({ status: 'success' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  // ─── Migration: Backfill category_abbr on existing tasks ─────────────────
  app.post('/api/migrate/category-abbr', (req, res) => {
    try {
      const mappings = [
        { pattern: 'SAT',              abbr: 'SAT' },
        { pattern: 'SFMS',             abbr: 'SFMS' },
        { pattern: 'IATF',             abbr: 'IATF' },
        { pattern: 'LPA',              abbr: 'LPA' },
        { pattern: 'CQTS',             abbr: 'CQTS' },
        { pattern: 'Strat.Proj',       abbr: 'PROJECT' },
        { pattern: 'Power Automate',   abbr: 'TOOL' },
        { pattern: 'Sorting Tool',     abbr: 'TOOL' },
        { pattern: 'Safe Launch Tool', abbr: 'TOOL' },
        { pattern: 'DS & G',           abbr: 'PROJECT' },
        { pattern: 'DQS',              abbr: 'PROJECT' },
        { pattern: 'CFK',              abbr: 'PROJECT' },
        { pattern: 'Admin/Learning',   abbr: 'ALS' },
      ];
      const stmt = db.prepare("UPDATE tasks SET category_abbr = ? WHERE task_name LIKE ? AND (category_abbr IS NULL OR category_abbr = '')");
      const migrate = db.transaction(() => {
        let total = 0;
        for (const { pattern, abbr } of mappings) {
          const result = stmt.run(abbr, `%${pattern}%`);
          console.log(`  [migrate] %${pattern}% → ${abbr}: ${result.changes} rows`);
          total += result.changes;
        }
        return total;
      });
      const total = migrate();
      console.log(`✅ Migration complete: ${total} tasks updated`);
      res.json({ status: 'success', updated: total });
    } catch (err) {
      console.error('Migration error:', err);
      res.status(500).json({ error: 'Migration failed' });
    }
  });

  // ─── Analytics ────────────────────────────────────────────────────────────
  app.get('/api/analytics/trend/:memberId', (req, res) => {
    const history = db.prepare(`
      SELECT w.week_number, w.year, t.priority, t.category_abbr, SUM(t.effort_hours) as effort
      FROM weeks w JOIN tasks t ON w.id = t.week_id
      WHERE t.member_id = ?
      GROUP BY w.year, w.week_number, t.priority, t.category_abbr
      ORDER BY w.year DESC, w.week_number DESC LIMIT 40
    `).all(req.params.memberId);
    res.json(history);
  });

  // ─── Vite / Static ───────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
