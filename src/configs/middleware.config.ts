import { NextFunction, Request, Response } from 'express';
import logger from '@/configs/logger.config';
import {
	ForbiddenException,
	UnauthorizedException
} from '@/exceptions/http-exception';
import AuthService from '@/services/auth.service';

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
	try {
		const authHeader = req.headers['authorization'];
		if (!authHeader) {
			return next(
				new UnauthorizedException('Authorization header missing')
			); // Pass error to next middleware
		}
		const token = authHeader.replace(/^Bearer\s/, '');
		if (!token) {
			return next(new UnauthorizedException('Token missing'));
		}
		const { id, role } = await AuthService.decode(token);
		if (!id) {
			return next(new UnauthorizedException('Invalid userId in token'));
		}
		logger.debug(`userId: ${id}, role: ${role}`);
		req.userId = id;
		req.userRole = role;
		next();
	} catch (error) {
		logger.error('Auth error:', error);
		next(new UnauthorizedException('Invalid token'));
	}
}

function roleRequire(roles?: string | string[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		authMiddleware(req, res, (err) => {
			if (err) {
				return next(err);
			}
			if (roles) {
				const requiredRoles = Array.isArray(roles) ? roles : [roles];
				const userRoles = req.userRole || [];
				if (!requiredRoles.some((role) => userRoles.includes(role))) {
					next(new ForbiddenException('Insufficient permissions'));
				}
			}

			next();
		});
	};
}

// export { authMiddleware };
export default roleRequire;
