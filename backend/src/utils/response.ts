import { Response } from 'express';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export const sendSuccess = (res: Response, data: any, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (res: Response, error: Error | AppError, statusCode = 500) => {
  const code = error instanceof AppError ? error.statusCode : statusCode;
  res.status(code).json({ success: false, message: error.message, data: null });
};
