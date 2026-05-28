/**
 * Validation schemas for SANGAM platform
 * Using regex patterns for simple validation
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation - at least 8 chars, uppercase, lowercase, number
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

// Username validation - alphanumeric and underscore, 3-20 chars
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// Phone validation - basic international format
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * User validators
 */
export const userValidators = {
  validateEmail: (email) => {
    if (!email || typeof email !== 'string') return false;
    return EMAIL_REGEX.test(email.trim());
  },

  validatePassword: (password) => {
    if (!password || typeof password !== 'string') return false;
    return PASSWORD_REGEX.test(password);
  },

  validateUsername: (username) => {
    if (!username || typeof username !== 'string') return false;
    return USERNAME_REGEX.test(username.trim());
  },

  validatePhone: (phone) => {
    if (!phone) return true; // Optional field
    return PHONE_REGEX.test(phone.toString());
  },

  validateRegistration: (data) => {
    const errors = [];

    if (!data.email) errors.push('Email is required');
    else if (!userValidators.validateEmail(data.email)) errors.push('Invalid email format');

    if (!data.password) errors.push('Password is required');
    else if (!userValidators.validatePassword(data.password)) {
      errors.push('Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, and 1 number');
    }

    if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim().length < 2) {
      errors.push('Full name must be at least 2 characters');
    }

    if (data.phone && !userValidators.validatePhone(data.phone)) {
      errors.push('Invalid phone number');
    }

    return { isValid: errors.length === 0, errors };
  },

  validateLogin: (data) => {
    const errors = [];

    if (!data.email) errors.push('Email is required');
    else if (!userValidators.validateEmail(data.email)) errors.push('Invalid email format');

    if (!data.password) errors.push('Password is required');

    return { isValid: errors.length === 0, errors };
  },

  validatePasswordChange: (data) => {
    const errors = [];

    if (!data.currentPassword) errors.push('Current password is required');
    if (!data.newPassword) errors.push('New password is required');
    else if (!userValidators.validatePassword(data.newPassword)) {
      errors.push('New password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, and 1 number');
    }
    if (!data.confirmPassword) errors.push('Password confirmation is required');
    else if (data.newPassword !== data.confirmPassword) errors.push('Passwords do not match');

    return { isValid: errors.length === 0, errors };
  }
};

/**
 * Project validators
 */
export const projectValidators = {
  validateProjectCreation: (data) => {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 3) {
      errors.push('Project name must be at least 3 characters');
    }

    if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 10) {
      errors.push('Project description must be at least 10 characters');
    }

    if (!data.departmentId) {
      errors.push('Department is required');
    }

    if (data.startDate && isNaN(new Date(data.startDate).getTime())) {
      errors.push('Invalid start date');
    }

    if (data.endDate && isNaN(new Date(data.endDate).getTime())) {
      errors.push('Invalid end date');
    }

    if (data.budget !== undefined && (typeof data.budget !== 'number' || data.budget < 0)) {
      errors.push('Budget must be a positive number');
    }

    const validStatuses = ['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('Invalid project status');
    }

    return { isValid: errors.length === 0, errors };
  },

  validateProjectUpdate: (data) => {
    // Similar to creation but all fields optional
    const errors = [];

    if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length < 3)) {
      errors.push('Project name must be at least 3 characters');
    }

    if (data.description !== undefined && (typeof data.description !== 'string' || data.description.trim().length < 10)) {
      errors.push('Project description must be at least 10 characters');
    }

    if (data.startDate && isNaN(new Date(data.startDate).getTime())) {
      errors.push('Invalid start date');
    }

    if (data.endDate && isNaN(new Date(data.endDate).getTime())) {
      errors.push('Invalid end date');
    }

    if (data.budget !== undefined && (typeof data.budget !== 'number' || data.budget < 0)) {
      errors.push('Budget must be a positive number');
    }

    const validStatuses = ['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('Invalid project status');
    }

    return { isValid: errors.length === 0, errors };
  }
};

/**
 * Task validators
 */
export const taskValidators = {
  validateTaskCreation: (data) => {
    const errors = [];

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
      errors.push('Task title must be at least 3 characters');
    }

    if (!data.projectId) {
      errors.push('Project ID is required');
    }

    if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 5) {
      errors.push('Task description must be at least 5 characters');
    }

    if (data.dueDate && isNaN(new Date(data.dueDate).getTime())) {
      errors.push('Invalid due date');
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    if (data.priority && !validPriorities.includes(data.priority)) {
      errors.push('Invalid priority level');
    }

    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Submitted', 'On Hold'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('Invalid task status');
    }

    return { isValid: errors.length === 0, errors };
  },

  validateTaskUpdate: (data) => {
    const errors = [];

    if (data.title !== undefined && (typeof data.title !== 'string' || data.title.trim().length < 3)) {
      errors.push('Task title must be at least 3 characters');
    }

    if (data.description !== undefined && (typeof data.description !== 'string' || data.description.trim().length < 5)) {
      errors.push('Task description must be at least 5 characters');
    }

    if (data.dueDate && isNaN(new Date(data.dueDate).getTime())) {
      errors.push('Invalid due date');
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    if (data.priority && !validPriorities.includes(data.priority)) {
      errors.push('Invalid priority level');
    }

    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Submitted', 'On Hold'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('Invalid task status');
    }

    return { isValid: errors.length === 0, errors };
  }
};

/**
 * Department validators
 */
export const departmentValidators = {
  validateDepartmentCreation: (data) => {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
      errors.push('Department name must be at least 2 characters');
    }

    if (data.description && (typeof data.description !== 'string' || data.description.trim().length < 10)) {
      errors.push('Department description must be at least 10 characters');
    }

    if (data.headOfDepartment && typeof data.headOfDepartment !== 'string') {
      errors.push('Invalid head of department');
    }

    return { isValid: errors.length === 0, errors };
  }
};

/**
 * Resource validators
 */
export const resourceValidators = {
  validateResourceCreation: (data) => {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
      errors.push('Resource name must be at least 2 characters');
    }

    if (!data.type || typeof data.type !== 'string') {
      errors.push('Resource type is required');
    }

    if (!data.quantity || typeof data.quantity !== 'number' || data.quantity <= 0) {
      errors.push('Quantity must be a positive number');
    }

    if (!data.department) {
      errors.push('Department is required');
    }

    return { isValid: errors.length === 0, errors };
  }
};

/**
 * Path/Route validators
 */
export const pathValidators = {
  validatePathCreation: (data) => {
    const errors = [];

    if (!data.projectId) {
      errors.push('Project ID is required');
    }

    if (!data.points || !Array.isArray(data.points) || data.points.length < 2) {
      errors.push('At least 2 path points are required');
    }

    // Validate each point
    if (Array.isArray(data.points)) {
      data.points.forEach((point, index) => {
        if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
          errors.push(`Invalid coordinates at point ${index + 1}`);
        }
        if (point.lat < -90 || point.lat > 90 || point.lng < -180 || point.lng > 180) {
          errors.push(`Coordinates out of range at point ${index + 1}`);
        }
      });
    }

    return { isValid: errors.length === 0, errors };
  }
};

/**
 * Generic ID validators
 */
export const idValidators = {
  validateMongoId: (id) => {
    // MongoDB ObjectId is 24 hex characters
    return /^[0-9a-f]{24}$/.test(id);
  },

  validateIdArray: (ids) => {
    if (!Array.isArray(ids)) return false;
    return ids.every(id => this.validateMongoId(id));
  }
};

/**
 * File validators
 */
export const fileValidators = {
  validateFileUpload: (file) => {
    const errors = [];

    if (!file) {
      errors.push('File is required');
      return { isValid: false, errors };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push('File size must not exceed 10MB');
    }

    // Allowed MIME types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push('File type not allowed');
    }

    return { isValid: errors.length === 0, errors };
  }
};

export default {
  userValidators,
  projectValidators,
  taskValidators,
  departmentValidators,
  resourceValidators,
  pathValidators,
  idValidators,
  fileValidators
};
