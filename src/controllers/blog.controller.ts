
import { ErrorCode } from '@/constants/error-code';
import {
	CreateBlogPayload,
	UpdateBlogDto,
	UpdateBlogSchema
} from '@/dto/blog.dto';
import { BaseHttpResponse } from '@/lib/base-http-response';
import { ForbiddenException } from '@/exceptions/http-exception';
import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { IBlogController } from '@/interfaces/controller.interface';
import { BlogService } from '@/services/blog.service';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/constants/types';

@injectable()
export class BlogController implements IBlogController {
	constructor(
		@inject(TYPES.BlogService) private readonly _blogService: BlogService
	) {

		this.getBlogs = this.getBlogs.bind(this);
		this.getBlogById = this.getBlogById.bind(this);
		this.createBlog = this.createBlog.bind(this);
		this.updateBlog = this.updateBlog.bind(this);
		this.deleteBlog = this.deleteBlog.bind(this);
		this.getLastEditedBlog = this.getLastEditedBlog.bind(this);
		this.getPublishedBlogs = this.getPublishedBlogs.bind(this);
	}

	getBlogs = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> => {
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

	getBlogById = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> => {
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

	getLastEditedBlog = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> => {
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

	createBlog = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> => {
		try {
			const userId = req.userId;
			if (!userId) {
				throw new ForbiddenException('Forbidden');
			}
			req.body.author = userId;
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
			const blogData = { ...validationResult.data, author: userId };
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

	updateBlog = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> => {
		try {
			const userId = req.userId;
			if (!userId) {
				throw new ForbiddenException('Forbidden');
			}
			req.body.author = userId;
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

	deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
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

	getPublishedBlogs = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> => {
		try {
			const limit = parseInt(req.query.limit as string) || 10;
			const after = req.query.after as string;
			const query = req.query.query as string;

			const baseQuery: any = { published: true };
			if (query) {
				baseQuery.$or = [
					{ title: { $regex: query, $options: 'i' } }
					// { content: { $regex: query, $options: 'i' } }
				];
			}
			if (after) {
				const [timestamp, id] = after.split('_');
				baseQuery.$or = [
					{ createdAt: { $lt: new Date(parseInt(timestamp)) } },
					{
						$and: [
							{ createdAt: new Date(parseInt(timestamp)) },
							{ _id: { $lt: new Types.ObjectId(id) } }
						]
					}
				];
			}
			const blogs = await this._blogService.getPublishedBlogs(
				baseQuery,
				limit + 1
			);
			const total = await this._blogService.getTotalPublishedBlogs(
				baseQuery
			);
			const hasNextPage = blogs.length > limit;

			//remove extra
			const edges = blogs.slice(0, limit).map((blog) => ({
				cursor: `${blog.updatedAt.getTime()}_${blog._id.toString()}`,
				node: blog
			}));

			const pageInfo = {
				hasNextPage,
				endCursor:
					edges.length > 0 ? edges[edges.length - 1].cursor : null
			};
			const response = BaseHttpResponse.success(
				{ edges, total, pageInfo },
				200,
				'Get published blogs success'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	}

}
