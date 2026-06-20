import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '';
    cb(null, `${crypto.randomUUID()}${safeExt}`);
  },
});

const imageFileFilter = (_req, file, cb) => {
  if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
  cb(null, true);
};

export const imageUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 10 },
  fileFilter: imageFileFilter,
});
