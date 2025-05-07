import { ForbiddenException } from '@/exceptions/http-exception';
import { NextFunction, Request, Response } from 'express';
import { BaseHttpResponse } from '@/lib/base-http-response';
import UserService from '@/services/user.service';
export class UserController {
	private readonly _userService = UserService;
	constructor() {
		this.getAllUser = this.getAllUser.bind(this);
		this.getUserById = this.getUserById.bind(this);
		this.updateToAdmin = this.updateToAdmin.bind(this);
		this.removeAdminRole = this.removeAdminRole.bind(this);
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
			// const user = await this._userService.getUserById(userId);
			const response = BaseHttpResponse.success(
				null,
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
			// const role = req.body.role;
			// const user = await this._userService.updateRole(userId, role);
			const response = BaseHttpResponse.success(
				null,
				200,
				'Update role success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}

	async updateToAdmin(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const targetUserId = req.params.userId;
			if (!targetUserId) {
				throw new ForbiddenException('User ID is required');
			}

			const result = await this._userService.updateToAdmin(targetUserId);
			const response = BaseHttpResponse.success(
				result,
				200,
				'User updated to admin successfully'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}


	async removeAdminRole(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const targetUserId = req.params.userId;
			if (!targetUserId) {
				throw new ForbiddenException('User ID is required');
			}

			const result = await this._userService.removeAdminRole(targetUserId);
			const response = BaseHttpResponse.success(
				result,
				200,
				'Admin role removed successfully'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}
}
