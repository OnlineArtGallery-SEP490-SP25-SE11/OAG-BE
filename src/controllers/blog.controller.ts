import { BaseHttpResponse } from '@/lib/base-http-response';
import { ForbiddenException } from '@/exceptions/http-exception';
import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { IBlogController } from '@/interfaces/controller.interface';
import { BlogService } from '@/services/blog.service';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/constants/types';
import { Status } from '@/constants/enum';

@injectable()
export class BlogController implements IBlogController {
	constructor(
		@inject(TYPES.BlogService) private readonly _blogService: BlogService
	) {

		this.findAll = this.findAll.bind(this);
		this.findById = this.findById.bind(this);
		this.findLastEditedByUser = this.findLastEditedByUser.bind(this);
		this.findPublished = this.findPublished.bind(this);
		this.create = this.create.bind(this);
		this.update = this.update.bind(this);
		this.delete = this.delete.bind(this);
		this.approve = this.approve.bind(this);
		this.reject = this.reject.bind(this);
	}

	findAll = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> => {
		try {
			const blogs = await this._blogService.findAll();
			const response = BaseHttpResponse.success(
				blogs,
				200,
				'Get blogs success'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	};

	findById = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> => {
		try {
			const blog = await this._blogService.findById(req.params.id);
			const response = BaseHttpResponse.success(
				blog,
				200,
				'Get blog success'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	};

	findLastEditedByUser = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> => {
		try {
			const userId = req.userId;
			const blog = await this._blogService.findLastEditedByUser(userId!);
			const response = BaseHttpResponse.success(
				blog,
				200,
				'Get last edited blog success'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	};

	create = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> => {
		try {
			// Use the pre-validated data
			const blogData = { ...req.validatedData };
			const blog = await this._blogService.create(req.userId!, blogData);

			const response = BaseHttpResponse.success(
				blog,
				201,
				'Create blog success'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	};

	update = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> => {
		try {


			const role = req.userRole!;
			const blogId = req.params.id;
			const blogData = req.validatedData;

			const blog = await this._blogService.update({
				blogId,
				userId: req.userId!,
				data: blogData,
				role
			});
			const response = BaseHttpResponse.success(
				blog,
				200,
				'Update blog success'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	};

	delete = async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.userId;
		if (!userId) {
			throw new ForbiddenException('Forbidden');
		}
		const roleId = req.userRole!;
		const blogId = req.params.id;
		try {
			await this._blogService.delete(blogId, userId, roleId);
			res.status(204).json(
				BaseHttpResponse.success(null, 204, 'Delete blog success')
			);
		} catch (error) {
			next(error);
		}
	};

	findPublished = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> => {
		try {
			const limit = parseInt(req.query.limit as string) || 10;
			const after = req.query.after as string;
			const query = req.query.query as string;

			const baseQuery: any = {};
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
			const blogs = await this._blogService.findPublished(
				baseQuery,
				limit + 1
			);
			const total = await this._blogService.countPublished(
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

	approve = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
		try {
			const userId = req.userId;
			if (!userId) {
				throw new ForbiddenException('Forbidden');
			}
			const blogId = req.params.id;

			// Directly pass blogId
			const blog = await this._blogService.approve(blogId);

			const response = BaseHttpResponse.success(
				blog,
				200,
				'Blog approved successfully'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	}

	reject = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
		try {
			const userId = req.userId;
			if (!userId) {
				throw new ForbiddenException('Forbidden');
			}

			const blogId = req.params.id;
			const { reason } = req.validatedData;

			// Directly pass blogId and reason
			await this._blogService.reject(blogId, reason);

			const response = BaseHttpResponse.success(
				null,
				200,
				'Blog rejected successfully'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	}

	requestPublish = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
		try {
			const userId = req.userId;
			if (!userId) {
				throw new ForbiddenException('Forbidden');
			}

			const blogId = req.params.id;

			// Pass the ID from params
			const blog = await this._blogService.requestPublish(blogId, userId);

			const response = BaseHttpResponse.success(
				blog,
				200,
				'Blog submitted for review successfully'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	}

	findUserBlogs = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
		try {
			const blogs = await this._blogService.find({ userId: req.userId! });
			const response = BaseHttpResponse.success(
				blogs,
				200,
				'Blogs retrieved successfully'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	}

	find = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
		try {
			const { page, limit, sort, filter, status, search } = req.query;
			let statusParam: Status | Status[] | undefined = undefined;
			if (status) {
				if (typeof status === 'string' && status.includes(',')) {
					statusParam = status.split(',') as Status[];
				} else {
					statusParam = status as Status;
				}
			}
			const blogs = await this._blogService.find({
				page: parseInt(page as string) || 1,
				limit: parseInt(limit as string) || 10,
				sort: sort as Record<string, any>,
				filter: filter as Record<string, any>,
				status: statusParam,
				search: search as string
			});
			const response = BaseHttpResponse.success(
				blogs,
				200,
				'Blogs retrieved successfully'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	}
}
