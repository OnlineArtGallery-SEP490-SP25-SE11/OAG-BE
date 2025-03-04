import { Request, Response, NextFunction, RequestHandler } from 'express';
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
) : RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request data against schema
      console.log(req[source], 'source');
      const result = await schema.safeParseAsync(req[source]);

      if (!result.success) {
        // Format validation errors
        const formattedErrors = result.error.errors.map((error) => ({
          path: error.path.join('.'),
          message: error.message
        }));
        logger.error(formattedErrors, 'Validation failed data');
        
        // Send error response and STOP here
        res.status(400).json(
          BaseHttpResponse.error(
            'Validation failed',
            400,
            ErrorCode.VALIDATION_ERROR,
            formattedErrors
          )
        );
        return;
      }
      
      // If we reach here, validation was successful
      // Add validated data to request object
      req.validatedData = result.success ? result.data : {};
      
      // Continue with the next middleware
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