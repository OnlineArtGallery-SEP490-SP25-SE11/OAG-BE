import logger from '@/configs/logger.config';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware xử lý lỗi
 * @param err
 * @param req
 * @param res
 * @param next
 */
export const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	logger.error({ err, req }, 'Unhandled error occurred'); // Log lỗi chi tiết
	res.status(500).send('Internal Server Error');
	next();
};
