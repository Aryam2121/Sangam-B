/**
 * Express middleware for request validation
 * Validates request body, query parameters, and URL parameters
 */

import { ApiError } from '../utils/ApiError.js';

/**
 * Middleware factory to validate request body
 * @param {Function} validatorFn - Validator function that returns { isValid, errors }
 */
export const validateBody = (validatorFn) => {
  return (req, res, next) => {
    const validation = validatorFn(req.body);

    if (!validation.isValid) {
      return next(new ApiError(400, validation.errors.join('; ')));
    }

    next();
  };
};

/**
 * Middleware to validate MongoDB ObjectIds
 * @param {string|string[]} paramNames - Name(s) of URL parameters or body fields to validate
 */
export const validateMongoIds = (paramNames) => {
  return (req, res, next) => {
    const params = Array.isArray(paramNames) ? paramNames : [paramNames];
    const MONGO_ID_REGEX = /^[0-9a-f]{24}$/i;

    for (const param of params) {
      const value = req.params[param] || req.body[param] || req.query[param];

      if (value && !MONGO_ID_REGEX.test(value)) {
        return next(new ApiError(400, `Invalid ID format: ${param}`));
      }
    }

    next();
  };
};

/**
 * Middleware to validate query parameters
 */
export const validateQuery = (validationRules) => {
  return (req, res, next) => {
    const errors = [];

    // Validate known parameters
    for (const [key, rule] of Object.entries(validationRules)) {
      const value = req.query[key];

      if (rule.required && !value) {
        errors.push(`${key} is required`);
        continue;
      }

      if (value) {
        if (rule.type === 'number' && isNaN(Number(value))) {
          errors.push(`${key} must be a number`);
        }
        if (rule.type === 'date' && isNaN(new Date(value).getTime())) {
          errors.push(`${key} must be a valid date`);
        }
        if (rule.type === 'boolean' && !['true', 'false'].includes(value.toLowerCase())) {
          errors.push(`${key} must be true or false`);
        }
        if (rule.enum && !rule.enum.includes(value)) {
          errors.push(`${key} must be one of: ${rule.enum.join(', ')}`);
        }
      }
    }

    if (errors.length > 0) {
      return next(new ApiError(400, errors.join('; ')));
    }

    next();
  };
};

/**
 * Middleware to validate request content type
 */
export const validateContentType = (expectedTypes = ['application/json']) => {
  return (req, res, next) => {
    const contentType = req.get('content-type');

    if (!contentType) {
      return next(new ApiError(400, 'Content-Type header is required'));
    }

    const isValid = expectedTypes.some(type => contentType.includes(type));

    if (!isValid) {
      return next(new ApiError(415, `Content-Type must be one of: ${expectedTypes.join(', ')}`));
    }

    next();
  };
};

/**
 * Middleware to sanitize input data (prevent XSS)
 */
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Remove potentially harmful HTML tags and script tags
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .trim();
      } else if (typeof value === 'object') {
        sanitized[key] = sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }

  next();
};

/**
 * Middleware to check required fields in request body
 */
export const requireFields = (fields) => {
  return (req, res, next) => {
    const missing = [];

    fields.forEach(field => {
      if (!(field in req.body) || req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      return next(new ApiError(400, `Missing required fields: ${missing.join(', ')}`));
    }

    next();
  };
};

export default {
  validateBody,
  validateMongoIds,
  validateQuery,
  validateContentType,
  sanitizeInput,
  requireFields
};
