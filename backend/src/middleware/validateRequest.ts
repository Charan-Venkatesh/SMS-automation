/**
 * Request Validation Middleware
 * Purpose: Validates API requests using Zod schemas.
 * Ensures data integrity before processing.
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

export const createMessageSchema = z.object({
  phoneNumber: z.string().min(10).max(20),
  message: z.string().min(1).max(1600),
});

export const updateStatusSchema = z.object({
  deviceId: z.string().optional(),
  errorMessage: z.string().optional(),
});
