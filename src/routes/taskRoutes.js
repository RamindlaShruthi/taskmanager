const express = require('express');
const { run, get, all } = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { required, isValidStatus, isDateString } = require('../utils/validators');

const router = express.Router();

async function taskQuery(whereClause, params) {
  return all(
    `SELECT t.*, p.name AS project_name, assigned.name AS assigned_to_name, creator.name AS created_by_name,
            CASE WHEN date(t.due_date) < date('now') AND t.status != 'Completed' THEN 1 ELSE 0 END AS is_overdue
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     JOIN users assigned ON assigned.id = t.assigned_to
     JOIN users creator ON creator.id = t.created_by
     ${whereClause}
     ORDER BY date(t.due_date) ASC`,
    params
  );
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    if (req.user.role === 'Admin') {
      return res.json(await taskQuery('', []));
    }
    res.json(await taskQuery('WHERE t.assigned_to = ?', [req.user.id]));
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { title, description = '', dueDate, projectId, assignedTo } = req.body;
    if (!required(title) || !required(projectId) || !required(assignedTo) || !isDateString(dueDate)) {
      return res.status(400).json({
        message: 'Title, valid due date, project, and assigned member are required'
      });
    }

    const project = await get('SELECT id FROM projects WHERE id = ?', [projectId]);
    const member = await get(
      'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, assignedTo]
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!member) {
      return res.status(400).json({ message: 'Assigned user must be a member of the project' });
    }

    const result = await run(
      `INSERT INTO tasks (title, description, due_date, project_id, assigned_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title.trim(), description.trim(), dueDate, projectId, assignedTo, req.user.id]
    );
    const task = await get('SELECT * FROM tasks WHERE id = ?', [result.id]);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const taskId = Number(req.params.id);
    const { status } = req.body;

    if (!isValidStatus(status)) {
      return res.status(400).json({ message: 'Status must be Pending, In Progress, or Completed' });
    }

    const task = await get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (req.user.role !== 'Admin' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'You can update only your assigned tasks' });
    }

    await run('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      status,
      taskId
    ]);
    res.json({ message: 'Task status updated' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await run('DELETE FROM tasks WHERE id = ?', [Number(req.params.id)]);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
