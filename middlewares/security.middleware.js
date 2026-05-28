/**
 * Security middleware for SANGAM backend
 * Adds security headers and implements security best practices
 */

/**
 * Security headers middleware
 * Adds various security headers to protect against common vulnerabilities
 */
export const securityHeaders = (req, res, next) => {
    // Remove X-Powered-By header to hide server implementation
    res.removeHeader('X-Powered-By');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Prevent clickjacking attacks
    res.setHeader('X-Frame-Options', 'DENY');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Feature Policy (Permissions Policy)
    res.setHeader('Permissions-Policy',
        'geolocation=(), microphone=(), camera=(), payment=()'
    );

    // Strict Transport Security (HSTS)
    // Note: Only set in production with HTTPS
    if (process.env.NODE_ENV === 'production') {
        res.setHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }

    // Content Security Policy (CSP)
    // Restrict resource loading to same origin and trusted sources
    const cspHeader = process.env.NODE_ENV === 'production'
        ? "default-src 'self'; script-src 'self'; style-src 'self' https:; img-src 'self' https:; font-src 'self' https:; connect-src 'self' https://api.sangam.local; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https:; img-src 'self' https: data:; font-src 'self' https: data:; connect-src 'self' https: http: ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';";

    res.setHeader('Content-Security-Policy', cspHeader);

    // Expect-CT header (for certificate transparency)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Expect-CT', 'max-age=86400, enforce');
    }

    next();
};

/**
 * API security headers middleware
 * Additional headers specific to API responses
 */
export const apiSecurityHeaders = (req, res, next) => {
    // Disable caching for sensitive data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    next();
};

/**
 * CORS validation middleware
 * Validates that requests come from allowed origins
 */
export const corsValidation = (req, res, next) => {
    const origin = req.get('origin');
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5174'|| 'http://localhost:5173').split(',');

    if (origin && !allowedOrigins.includes(origin)) {
        // Log suspicious CORS requests in production
        if (process.env.NODE_ENV === 'production') {
            console.warn(`⚠️  Suspicious CORS request from: ${origin}`);
        }
    }

    next();
};

/**
 * Request size validation middleware
 * Prevents excessively large payloads
 */
export const requestSizeLimit = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = req.get('content-length');

        if (contentLength) {
            const maxBytes = parseBytes(maxSize);
            const currentBytes = parseInt(contentLength, 10);

            if (currentBytes > maxBytes) {
                return res.status(413).json({
                    success: false,
                    message: `Request body too large. Maximum allowed: ${maxSize}`
                });
            }
        }

        next();
    };
};

/**
 * Parse size string to bytes
 * Examples: '10mb', '1gb', '100kb'
 */
const parseBytes = (sizeStr) => {
    const units = {
        'b': 1,
        'kb': 1024,
        'mb': 1024 * 1024,
        'gb': 1024 * 1024 * 1024
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/i);
    if (!match) throw new Error(`Invalid size format: ${sizeStr}`);

    const [, value, unit] = match;
    return Math.ceil(parseFloat(value) * (units[unit.toLowerCase()] || 1));
};

/**
 * API key validation middleware
 * For internal service authentication
 */
export const validateApiKey = (req, res, next) => {
    const apiKey = req.get('x-api-key');
    const validApiKey = process.env.API_KEY;

    // Only enforce API key in production
    if (process.env.NODE_ENV === 'production' && validApiKey) {
        if (!apiKey || apiKey !== validApiKey) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or missing API key'
            });
        }
    }

    next();
};

/**
 * SQL injection prevention helper
 * Sanitizes input strings
 */
export const sanitizeSql = (input) => {
    if (typeof input !== 'string') return input;

    // Remove dangerous SQL characters and commands
    return input
        .replace(/['";\\]/g, '')
        .replace(/(\b(DROP|DELETE|INSERT|UPDATE|ALTER|EXEC|EXECUTE|SELECT|UNION|CREATE)\b)/gi, '')
        .trim();
};

/**
 * XSS prevention helper
 * Escapes HTML special characters
 */
export const escapeHtml = (text) => {
    if (typeof text !== 'string') return text;

    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, m => map[m]);
};

/**
 * Rate limiting bypass protection
 * Prevents header spoofing for rate limiter evasion
 */
export const preventRateLimitBypass = (req, res, next) => {
    // Prevent X-Forwarded-For header spoofing by validating IP
    const clientIp = req.ip;
    const forwarded = req.get('x-forwarded-for');

    // In production, only trust X-Forwarded-For from known proxies
    if (process.env.NODE_ENV === 'production' && forwarded) {
        const trustedProxies = (process.env.TRUSTED_PROXIES || '').split(',');
        if (!trustedProxies.includes(clientIp)) {
            // Remove X-Forwarded-For if not from trusted proxy
            req.headers['x-forwarded-for'] = clientIp;
        }
    }

    next();
};

/**
 * Input validation for common attack patterns
 */
export const validateInputPatterns = (req, res, next) => {
    // Skip for GET requests
    if (req.method === 'GET') {
        return next();
    }

    const body = req.body;
    if (!body || typeof body !== 'object') {
        return next();
    }

    const dangerousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        />\s*<\s*/gi
    ];

    const checkValue = (value) => {
        if (typeof value === 'string') {
            for (const pattern of dangerousPatterns) {
                if (pattern.test(value)) {
                    return true;
                }
            }
        } else if (typeof value === 'object' && value !== null) {
            for (const v of Object.values(value)) {
                if (checkValue(v)) return true;
            }
        }
        return false;
    };

    if (checkValue(body)) {
        return res.status(400).json({
            success: false,
            message: 'Request contains potentially malicious content'
        });
    }

    next();
};

export default {
    securityHeaders,
    apiSecurityHeaders,
    corsValidation,
    requestSizeLimit,
    validateApiKey,
    sanitizeSql,
    escapeHtml,
    preventRateLimitBypass,
    validateInputPatterns
};
