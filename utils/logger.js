/**
 * Logger utility for SANGAM backend
 * Handles all logging across the application
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels with priorities
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

// Get current log level from environment
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production'
    ? LOG_LEVELS.WARN
    : LOG_LEVELS.DEBUG;

/**
 * Format timestamp
 */
const getTimestamp = () => {
    return new Date().toISOString();
};

/**
 * Format log message
 */
const formatLogMessage = (level, message, data = null) => {
    const timestamp = getTimestamp();
    let logMessage = `[${timestamp}] [${level}] ${message}`;

    if (data) {
        logMessage += ` | ${JSON.stringify(data)}`;
    }

    return logMessage;
};

/**
 * Write log to file
 */
const writeToFile = (level, message, filename = 'app.log') => {
    try {
        const logPath = path.join(logsDir, filename);
        const logMessage = formatLogMessage(level, message) + '\n';
        fs.appendFileSync(logPath, logMessage);
    } catch (error) {
        console.error('Failed to write log to file:', error);
    }
};

/**
 * Write to console with colors
 */
const writeToConsole = (level, message, data = null) => {
    const colors = {
        ERROR: '\x1b[31m',    // Red
        WARN: '\x1b[33m',     // Yellow
        INFO: '\x1b[36m',     // Cyan
        DEBUG: '\x1b[35m'     // Magenta
    };
    const reset = '\x1b[0m';

    const logMessage = formatLogMessage(level, message, data);
    const colorCode = colors[level] || reset;

    console.log(`${colorCode}${logMessage}${reset}`);
};

/**
 * Check if log level should be logged
 */
const shouldLog = (level) => {
    return LOG_LEVELS[level] <= CURRENT_LOG_LEVEL;
};

/**
 * Logger object with methods for each log level
 */
export const logger = {
    /**
     * Log error level
     */
    error: (message, error = null) => {
        if (!shouldLog('ERROR')) return;

        const data = error ? {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            code: error.code
        } : null;

        writeToConsole('ERROR', message, data);
        writeToFile('ERROR', message, 'error.log');
    },

    /**
     * Log warning level
     */
    warn: (message, data = null) => {
        if (!shouldLog('WARN')) return;

        writeToConsole('WARN', message, data);
        writeToFile('WARN', message, 'app.log');
    },

    /**
     * Log info level
     */
    info: (message, data = null) => {
        if (!shouldLog('INFO')) return;

        writeToConsole('INFO', message, data);
        writeToFile('INFO', message, 'app.log');
    },

    /**
     * Log debug level
     */
    debug: (message, data = null) => {
        if (!shouldLog('DEBUG')) return;

        writeToConsole('DEBUG', message, data);
        writeToFile('DEBUG', message, 'debug.log');
    }
};

/**
 * Request logger middleware
 * Logs all incoming requests with response times
 */
export const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log incoming request
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userId: req.user?._id || 'anonymous'
    });

    // Capture the original res.json and res.send methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Override res.json
    res.json = function(data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Log response
        logger.info(`${req.method} ${req.path} - ${statusCode} (${duration}ms)`, {
            userId: req.user?._id || 'anonymous',
            duration
        });

        return originalJson.call(this, data);
    };

    // Override res.send
    res.send = function(data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        logger.info(`${req.method} ${req.path} - ${statusCode} (${duration}ms)`, {
            userId: req.user?._id || 'anonymous',
            duration
        });

        return originalSend.call(this, data);
    };

    next();
};

/**
 * Database operation logger
 */
export const logDatabaseOperation = (operation, model, duration, success = true) => {
    const status = success ? 'SUCCESS' : 'FAILED';
    logger.debug(`DB ${operation} on ${model}: ${status}`, { duration: `${duration}ms` });
};

/**
 * Authentication event logger
 */
export const logAuthEvent = (event, userId, success = true, error = null) => {
    const status = success ? 'SUCCESS' : 'FAILED';
    const message = `AUTH_${event}: ${status}`;
    logger.info(message, {
        userId,
        error: error ? error.message : undefined
    });
};

/**
 * CRUD operation logger
 */
export const logCrudOperation = (operation, resource, resourceId, userId, success = true, error = null) => {
    const status = success ? 'SUCCESS' : 'FAILED';
    const message = `CRUD ${operation.toUpperCase()} on ${resource}: ${status}`;
    logger.info(message, {
        resourceId,
        userId,
        error: error ? error.message : undefined
    });
};

/**
 * Rotate log files by date
 * Run this periodically (e.g., daily) to manage log file sizes
 */
export const rotateLogFiles = () => {
    try {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

        const files = ['app.log', 'error.log', 'debug.log'];

        files.forEach(file => {
            const logPath = path.join(logsDir, file);
            const backupPath = path.join(logsDir, `${file}.${dateStr}`);

            if (fs.existsSync(logPath)) {
                fs.renameSync(logPath, backupPath);
                // Compress old logs (optional - requires additional library)
                logger.info(`Rotated log file: ${file}`);
            }
        });
    } catch (error) {
        console.error('Error rotating log files:', error);
    }
};

/**
 * Clean old log files (keep only last 30 days)
 */
export const cleanOldLogs = () => {
    try {
        const files = fs.readdirSync(logsDir);
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            const stat = fs.statSync(filePath);

            if (stat.mtimeMs < thirtyDaysAgo) {
                fs.unlinkSync(filePath);
                logger.info(`Deleted old log file: ${file}`);
            }
        });
    } catch (error) {
        console.error('Error cleaning old logs:', error);
    }
};

export default logger;
