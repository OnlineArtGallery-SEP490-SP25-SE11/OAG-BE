import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { BaseHttpResponse } from '@/lib/base-http-response';
import { ErrorCode } from '@/constants/error-code';
import logger from '@/configs/logger.config';

/**
 * Creates a middleware that validates request data against a Zod schema
 * @param schema The Zod schema to validate against
 * @param source Where to find the data to validate ('body', 'query', 'params')
 */
export const validate = (
  schema: AnyZodObject,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request data against schema
      const result = await schema.safeParseAsync(req[source]);
      if (!result.success) {
        // Format validation errors
        const formattedErrors = result.error.errors.map((error) => ({
          path: error.path.join('.'),
          message: error.message
        }));
        
        // Send error response
        res.status(400).json(
          BaseHttpResponse.error(
            'Validation failed',
            400,
            ErrorCode.VALIDATION_ERROR,
            formattedErrors
          )
        );
      }
      
      // Add validated data to request object
      req.validatedData = result.data;
      next();
    } catch (error) {
      logger.error(error, 'Validation middleware error');
      res.status(500).json(
        BaseHttpResponse.error(
          'Internal server error during validation',
          500,
          ErrorCode.SERVER_ERROR
        )
      );
    }
  };
};