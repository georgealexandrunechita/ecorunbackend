const express = require('express');
const { pool } = require('../src/config/db');

const router = express.Router();

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
