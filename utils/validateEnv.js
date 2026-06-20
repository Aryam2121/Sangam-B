/**
 * Validates required environment variables at startup.
 * Fails fast in production when secrets are missing.
 */
const REQUIRED_ALWAYS = [
  'MONGODB_URI',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'ACCESS_TOKEN_EXPIRY',
  'REFRESH_TOKEN_EXPIRY',
];

const REQUIRED_IN_PRODUCTION = [
  'CORS_ORIGIN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

export const validateEnv = () => {
  const missing = REQUIRED_ALWAYS.filter((key) => !process.env[key]?.trim());

  if (process.env.NODE_ENV === 'production') {
    missing.push(...REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]?.trim()));
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    }
    console.warn(`[env] ${message}`);
  }

  const cloudinaryVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingCloudinary = cloudinaryVars.filter((key) => !process.env[key]?.trim());
  if (missingCloudinary.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn(`[env] Missing Cloudinary environment variables: ${missingCloudinary.join(', ')} (file uploads will fail)`);
  }
};

export default validateEnv;
