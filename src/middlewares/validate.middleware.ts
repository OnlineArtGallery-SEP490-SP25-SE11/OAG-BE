import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import logger from '@/configs/logger.config';

export const validate =
	(schema: AnyZodObject) =>
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			await schema.parseAsync(req.body);
			next();
		} catch (error) {
			if (error instanceof ZodError) {
				logger.error('Validation error:', error.errors);
				res.status(400).json({
					isAuthenticated: false,
					message: error.errors.map((e) => e.message).join(', '),
					user: null
				});
			}
			next(error);
		}
	};
