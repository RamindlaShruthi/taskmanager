const express = require('express');
const { run, get, all } = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { required } = require('../utils/validators');

const router = express.Router();

async function canViewProject(user, projectId) {
  if (user.role === 'Admin') return true;
  const membership = await get(
    'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, user.id]
  );
  return Boolean(membership);
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = req.user.role === 'Admin'
      ? `SELECT p.*, u.name AS created_by_name
         FROM projects p
         JOIN users u ON u.id = p.created_by
         ORDER BY p.created_at DESC`
      : `SELECT DISTINCT p.*, u.name AS created_by_name
         FROM projects p
         JOIN users u ON u.id = p.created_by
         JOIN project_members pm ON pm.project_id = p.id
         WHERE pm.user_id = ?
         ORDER BY p.created_at DESC`;

    const projects = await all(sql, req.user.role === 'Admin' ? [] : [req.user.id]);
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, description = '' } = req.body;
    if (!required(name)) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const result = await run(
      'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)',
      [name.trim(), description.trim(), req.user.id]
    );
    const project = await get('SELECT * FROM projects WHERE id = ?', [result.id]);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    if (!(await canViewProject(req.user, projectId))) {
      return res.status(403).json({ message: 'You do not have access to this project' });
    }

    const project = await get(
      `SELECT p.*, u.name AS created_by_name
       FROM projects p
       JOIN users u ON u.id = p.created_by
       WHERE p.id = ?`,
      [projectId]
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const members = await all(
      `SELECT u.id, u.name, u.email, u.role
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ?
       ORDER BY u.name`,
      [projectId]
    );

    const tasks = await all(
      `SELECT t.*, assigned.name AS assigned_to_name, creator.name AS created_by_name
       FROM tasks t
       JOIN users assigned ON assigned.id = t.assigned_to
       JOIN users creator ON creator.id = t.created_by
       WHERE t.project_id = ?
       ORDER BY date(t.due_date) ASC`,
      [projectId]
    );

    res.json({ project, members, tasks });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/members', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const userId = Number(req.body.userId);

    const project = await get('SELECT id FROM projects WHERE id = ?', [projectId]);
    const user = await get("SELECT id FROM users WHERE id = ? AND role = 'Member'", [userId]);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!user) return res.status(404).json({ message: 'Member not found' });

    await run('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)', [
      projectId,
      userId
    ]);
    res.status(201).json({ message: 'Member added to project' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/members/:userId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const userId = Number(req.params.userId);

    const assignedTasks = await get(
      "SELECT id FROM tasks WHERE project_id = ? AND assigned_to = ? AND status != 'Completed' LIMIT 1",
      [projectId, userId]
    );
    if (assignedTasks) {
      return res.status(400).json({
        message: 'Complete or reassign this member tasks before removing them'
      });
    }

    await run('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
    res.json({ message: 'Member removed from project' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
