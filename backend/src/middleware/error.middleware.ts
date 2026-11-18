import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/responseHandler';
import { ENV } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new AppError(message, 404);
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = new AppError(message, 400);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((val: any) => val.message);
    const message = `Validation Error: ${errors.join(', ')}`;
    error = new AppError(message, 400, errors);
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Authentication token has expired', 401);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  if (ENV.NODE_ENV === 'development') {
    console.error('[Error Details]:', {
      message: err.message,
      stack: err.stack,
      statusCode
    });
  }

  return sendError(res, statusCode, message, error.errors);
};
