import multer from 'multer';
import path from 'path';
import { BadRequestError } from '../utils/errors';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.csv') {
      cb(new BadRequestError('Only .csv files are allowed') as any, false);
      return;
    }
    cb(null, true);
  },
});
