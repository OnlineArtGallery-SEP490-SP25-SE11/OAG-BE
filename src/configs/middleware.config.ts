import { NextFunction, Request, Response } from 'express';
import logger from '@/configs/logger.config';
import {
	BadRequestException,
	ForbiddenException,
	UnauthorizedException
} from '@/exceptions/http-exception';
import AuthService from '@/services/auth.service';
import User from '@/models/user.model';
import { BaseHttpResponse } from '@/lib/base-http-response';
import { ErrorCode } from '@/constants/error-code';

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

export function permanentBan() {
    return async (req: Request, res: Response, next: NextFunction) => {
        authMiddleware(req, res, async (err) => {
            if (err) { return next(err); }
            
            try {
                // Lấy userId từ request (được thiết lập bởi authMiddleware)
                const userId = req.userId;
                
                // Truy vấn người dùng từ database và kiểm tra trạng thái bị cấm
                const user = await User.findById(userId);
                if (!user) {
                    return next(new UnauthorizedException('User not found'));
                }
                // Kiểm tra nếu người dùng bị cấm
				console.log(user);
                if (user.isBanned) {
					return next(new ForbiddenException('this account is banned and cannot be implemented some function', ErrorCode.USER_BANNED));
                }
                
				next();

            } catch (error) {
                logger.error('Error checking ban status:', error);
                return next(new ForbiddenException('Error checking user status'));
            }
        });
    };
}

// export { authMiddleware };
export default roleRequire;
