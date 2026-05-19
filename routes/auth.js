const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { pool } = require('../src/config/db');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: 'Too many registration attempts. Please try again in 1 hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = express.Router();

router.post('/register', registerLimiter, [
    body('username').notEmpty().withMessage('Username required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password min 8 chars')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { username, name, surname, email, password } = req.body;
        const password_hash = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            'INSERT INTO users (username, name, surname, email, password_hash) VALUES (?, ?, ?, ?, ?)',
            [username, name || username, surname || '', email, password_hash]
        );

        const token = jwt.sign({ userId: result.insertId }, process.env.JWT_SECRET || 'secret');
        res.json({
            token,
            user: {
                id: result.insertId,
                username,
                name: name || username,
                surname: surname || '',
                email,
                eco_points: 0,
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'User already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, email]
        );

        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];
        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name || user.username,
                surname: user.surname || '',
                email: user.email,
                eco_points: user.eco_points,
                role: user.role,
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
