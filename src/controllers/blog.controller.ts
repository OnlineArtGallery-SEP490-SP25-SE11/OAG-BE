import { ErrorCode } from '@/constants/error-code';
import {
	CreateBlogPayload,
	UpdateBlogDto,
	UpdateBlogSchema
} from '@/dto/blog.dto';
import { BaseHttpResponse } from '@/lib/base-http-response';
import { BlogService } from '@/services/blog.service';
import { ForbiddenException } from '@/exceptions/http-exception';
import { NextFunction, Request, Response } from 'express';

export class BlogController {
	constructor(private readonly _blogService: BlogService) {
		this.getBlogs = this.getBlogs.bind(this);
		this.getBlogById = this.getBlogById.bind(this);
		this.createBlog = this.createBlog.bind(this);
		this.updateBlog = this.updateBlog.bind(this);
		this.deleteBlog = this.deleteBlog.bind(this);
		this.getLastEditedBlog = this.getLastEditedBlog.bind(this);
	}

	async getBlogs(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const blogs = await this._blogService.getBlogs();
			const response = BaseHttpResponse.success(
				blogs,
				200,
				'Get blogs success'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	}

	async getBlogById(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const blog = await this._blogService.getBlogById(req.params.id);
			const response = BaseHttpResponse.success(
				blog,
				200,
				'Get blog success'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	}

	async getLastEditedBlog(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const userId = req.userId;
			const blog = await this._blogService.getLastEditedBlog(userId!);
			const response = BaseHttpResponse.success(
				blog,
				200,
				'Get last edited blog success'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	}

	async createBlog(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const userId = req.userId;
			if (!userId) {
				throw new ForbiddenException('Forbidden');
			}
			req.body.userId = userId;
			const validationResult = CreateBlogPayload.safeParse(req.body);
			if (!validationResult.success) {
				const errors = validationResult.error.errors.map((error) => ({
					path: error.path.join('.'),
					message: error.message
				}));
				return res
					.status(400)
					.json(
						BaseHttpResponse.error(
							'Invalid blog data',
							400,
							ErrorCode.INVALID_BLOG_DATA,
							errors
						)
					);
			}
			const blogData = { ...validationResult.data, userId };
			const blog = await this._blogService.createBlog(blogData);
			const response = BaseHttpResponse.success(
				blog,
				201,
				'Create blog success'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	}

	async updateBlog(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const userId = req.userId;
			if (!userId) {
				throw new ForbiddenException('Forbidden');
			}
			req.body.userId = userId;
			const role = req.userRole!;
			const blogId = req.params.id;
			req.body._id = blogId;
			const validationResult = UpdateBlogSchema.safeParse(req.body);
			if (!validationResult.success) {
				const errors = validationResult.error.errors.map((error) => ({
					path: error.path.join('.'),
					message: error.message
				}));
				return res
					.status(400)
					.json(
						BaseHttpResponse.error(
							'Invalid blog data',
							400,
							ErrorCode.INVALID_BLOG_DATA,
							errors
						)
					);
			}
			const blogData: UpdateBlogDto = validationResult.data;

			const blog = await this._blogService.updateBlog(blogData, role);
			const response = BaseHttpResponse.success(
				blog,
				200,
				'Update blog success'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	}

	async deleteBlog(req: Request, res: Response, next: NextFunction) {
		const userId = req.userId;
		if (!userId) {
			throw new ForbiddenException('Forbidden');
		}
		const roleId = req.userRole!;
		const blogId = req.params.id;
		try {
			await this._blogService.deleteBlog(blogId, userId, roleId);
			res.status(204).json(
				BaseHttpResponse.success(null, 204, 'Delete blog success')
			);
		} catch (error) {
			next(error);
		}
	}
}
