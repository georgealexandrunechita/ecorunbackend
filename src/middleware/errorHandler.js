class AppError extends Error {
    constructor(message, statusCode, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message, details = null) {
        return new AppError(message, 400, details);
    }

    static unauthorized(message = 'Unauthorized') {
        return new AppError(message, 401);
    }

    static forbidden(message = 'Forbidden') {
        return new AppError(message, 403);
    }

    static notFound(message = 'Resource not found') {
        return new AppError(message, 404);
    }

    static conflict(message) {
        return new AppError(message, 409);
    }

    static internal(message = 'Internal server error') {
        return new AppError(message, 500);
    }
}

const errorHandler = (err, req, res, next) => {
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.details && { details: err.details }),
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
    }

    console.error('NON-OPERATIONAL ERROR:', err);

    return res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {
            error: err.message,
            stack: err.stack,
        }),
    });
};

const notFound = (req, res, next) => {
    next(AppError.notFound(`Route ${req.originalUrl} not found`));
};

module.exports = { AppError, errorHandler, notFound };
