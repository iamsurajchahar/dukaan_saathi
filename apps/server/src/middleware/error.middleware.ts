import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');

  const isDev = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    error: isDev ? err.message : 'Internal server error',
  });
};
