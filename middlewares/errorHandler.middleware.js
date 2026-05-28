/**
 * Comprehensive error handling middleware
 * Standardizes error responses across the backend
 */

import { ApiError } from '../utils/ApiError.js';

/**
 * Main error handling middleware
 * Must be used AFTER all other middlewares and routes
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('ERROR:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    });
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    const messages = Object.values(err.errors)
      .map(e => e.message)
      .join('; ');
    error = new ApiError(400, `Validation Error: ${messages}`);
  } else if (err.name === 'CastError') {
    // Mongoose ObjectId casting error
    error = new ApiError(400, `Invalid ID format: ${err.value}`);
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(err.keyPattern)[0];
    error = new ApiError(409, `Duplicate entry: ${field} already exists`);
  } else if (err.name === 'JsonWebTokenError') {
    // JWT validation error
    error = new ApiError(401, 'Invalid or malformed token');
  } else if (err.name === 'TokenExpiredError') {
    // JWT expiration error
    error = new ApiError(401, 'Token has expired');
  } else if (err.name === 'MulterError') {
    // Multer file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new ApiError(413, 'File size exceeds maximum allowed');
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error = new ApiError(413, 'Too many files uploaded');
    } else {
      error = new ApiError(400, `File upload error: ${err.message}`);
    }
  }

  // If not an ApiError instance, convert to one
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message);
  }

  // Prepare error response
  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  // Add errors array if present
  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors;
  }

  // Send response
  return res.status(error.statusCode).json(response);
};

/**
 * Middleware to catch 404 errors (no matching route found)
 */
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
  next(error);
};

/**
 * Async handler wrapper for controller functions
 * Catches async errors and passes them to error handler
 */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
