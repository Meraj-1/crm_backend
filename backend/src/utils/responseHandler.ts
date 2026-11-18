import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
  errors?: any;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message?: string,
  data?: T,
  meta?: ApiResponse['meta']
): Response => {
  const payload: ApiResponse<T> = {
    success,
    ...(message && { message }),
    ...(data !== undefined && { data }),
    ...(meta && { meta })
  };

  return res.status(statusCode).json(payload);
};

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message: string = 'Success',
  statusCode: number = 200,
  meta?: ApiResponse['meta']
): Response => {
  return sendResponse(res, statusCode, true, message, data, meta);
};

export const sendCreated = <T>(
  res: Response,
  data?: T,
  message: string = 'Created successfully'
): Response => {
  return sendResponse(res, 201, true, message, data);
};

export const sendError = (
  res: Response,
  statusCode: number = 500,
  message: string = 'Internal Server Error',
  errors?: any
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  });
};
