const express = require('express');
const { get } = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const filter = req.user.role === 'Admin' ? '' : 'WHERE assigned_to = ?';
    const params = req.user.role === 'Admin' ? [] : [req.user.id];

    const totals = await get(
      `SELECT
        COUNT(*) AS totalTasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completedTasks,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pendingTasks,
        SUM(CASE WHEN date(due_date) < date('now') AND status != 'Completed' THEN 1 ELSE 0 END) AS overdueTasks
       FROM tasks
       ${filter}`,
      params
    );

    res.json({
      totalTasks: totals.totalTasks || 0,
      completedTasks: totals.completedTasks || 0,
      pendingTasks: totals.pendingTasks || 0,
      overdueTasks: totals.overdueTasks || 0
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
