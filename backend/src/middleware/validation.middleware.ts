import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.slice(1).join('.'), // Remove "body", "query", etc. prefix
          message: err.message,
        }));
        res.status(400).json({
          error: 'Validation Failed',
          details: errors,
        });
        return;
      }
      next(error);
    }
  };
};

export default validateRequest;
