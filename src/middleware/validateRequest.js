const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            errors: errors.array()
        });
    }

    next();
};
