import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../utils/response';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  logger.error(`${req.method} ${req.path} - ${err.message}`, { stack: err.stack });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
};
