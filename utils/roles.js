export const ALL_ROLES = [
  'Main Admin',
  'Department Admin',
  'Officer',
  'Worker',
  'Technician',
  'Contractor',
];

export const SELF_REGISTRATION_ROLES = ['Worker', 'Officer', 'Department Admin'];

export const ADMIN_ROLES = ['Main Admin', 'Department Admin'];

export const MANAGER_ROLES = ['Main Admin', 'Department Admin', 'Officer'];

export const assertSelfRegistrationRole = (role) => {
  if (!SELF_REGISTRATION_ROLES.includes(role)) {
    return `Role must be one of: ${SELF_REGISTRATION_ROLES.join(', ')}`;
  }
  return null;
};
