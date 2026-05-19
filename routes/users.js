const express = require('express');
const { pool } = require('../src/config/db');
const authMiddleware = require('../src/middleware/authMiddleware');

const router = express.Router();

const ACHIEVEMENTS = [
  { id: 1, name: 'First Run',      icon: '🎯', condition: (s) => s.run_count >= 1   },
  { id: 2, name: '10 Runs',        icon: '🔥', condition: (s) => s.run_count >= 10  },
  { id: 3, name: 'Eco Starter',    icon: '🌱', condition: (s) => s.eco_points >= 100 },
  { id: 4, name: '100km Total',    icon: '💯', condition: (s) => s.total_km >= 100  },
  { id: 5, name: 'Top 50 Seville', icon: '🏆', condition: (s) => s.ranking <= 50   },
];

router.get('/:id/achievements', authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id);
  if (req.user.id !== userId) return res.status(403).json({ error: 'Forbidden' });

  try {
    const [[userRow]] = await pool.query(
      'SELECT eco_points FROM users WHERE id = ?', [userId]
    );
    if (!userRow) return res.status(404).json({ error: 'User not found' });

    const [[runStats]] = await pool.query(
      'SELECT COUNT(*) AS run_count, COALESCE(SUM(distance_km), 0) AS total_km FROM runs WHERE user_id = ?',
      [userId]
    );

    const [[rankRow]] = await pool.query(
      'SELECT COUNT(*) + 1 AS ranking FROM users WHERE eco_points > ?',
      [userRow.eco_points]
    );

    const stats = {
      run_count:  runStats.run_count,
      total_km:   parseFloat(runStats.total_km),
      eco_points: userRow.eco_points,
      ranking:    rankRow.ranking,
    };

    const achievements = ACHIEVEMENTS.map(({ id, name, icon, condition }) => ({
      id, name, icon, unlocked: condition(stats),
    }));

    res.json(achievements);
  } catch (err) {
    console.error('Error fetching achievements:', err);
    res.status(500).json({ error: 'Error fetching achievements' });
  }
});

router.get('/ranking', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const sql = `
        SELECT id, username, name, surname, eco_points
        FROM users
        ORDER BY eco_points DESC
        LIMIT ?
    `;
    try {
        const [rows] = await pool.query(sql, [limit]);
        const ranking = rows.map((u, index) => ({
            rank: index + 1,
            id: u.id,
            name: u.name || u.username,
            surname: u.surname || '',
            eco_points: u.eco_points,
        }));
        res.json(ranking);
    } catch (err) {
        console.error('Error fetching ranking:', err);
        res.status(500).json({ error: 'Error fetching ranking' });
    }
});

module.exports = router;
