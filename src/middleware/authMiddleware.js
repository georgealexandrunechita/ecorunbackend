const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token required' });
    }

    const token = header.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = { id: decoded.userId };
        next();
    } catch (err) {
        if (process.env.NODE_ENV !== 'test') console.error(err);
        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = authMiddleware;
