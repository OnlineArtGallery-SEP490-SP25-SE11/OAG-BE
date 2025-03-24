import { ForbiddenException } from '@/exceptions/http-exception';
import { NextFunction, Request, Response } from 'express';
import { ErrorCode } from '@/constants/error-code';
import { BaseHttpResponse } from '@/lib/base-http-response';
import UserService from '@/services/user.service';
export class UserController {
	private readonly _userService = UserService;
	constructor() {
		this.getAllUser = this.getAllUser.bind(this);
		this.getUserById = this.getUserById.bind(this);
	}
	async getAllUser(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const users = await this._userService.getAllUser();
			const response = BaseHttpResponse.success(
				users,
				200,
				'Get all user success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}
	async getUserById(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const userId = req.userId;
			if (!userId) {
				throw new ForbiddenException('Forbidden');
			}
			const user = await this._userService.getUserById(userId);
			const response = BaseHttpResponse.success(
				user,
				200,
				'Get user success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}
	async updateRole(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const userId = req.userId;
			if (!userId) {
				throw new ForbiddenException('Forbidden');
			}
			const role = req.body.role;
			const user = await this._userService.updateRole(userId, role);
			const response = BaseHttpResponse.success(
				user,
				200,
				'Update role success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}
}
