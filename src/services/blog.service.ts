import logger from '@/configs/logger.config';
import { ErrorCode } from '@/constants/error-code';
import { CreateBlogDto, RejectBlogDto, UpdateBlogDto } from '@/dto/blog.dto';
import { CouldNotFindBlogException } from '@/exceptions';
import {
	BadRequestException,
	InternalServerErrorException,
	UnauthorizedException,
} from "@/exceptions/http-exception";
import BlogModel, { Blog, BlogDocument } from "@/models/blog.model";
import { Types } from "mongoose";
import { inject, injectable } from "inversify";
import { TYPES } from '@/constants/types';
import { IBlogService } from '@/interfaces/service.interface';
import { BlogTagService } from './blog-tag.service';
import NotificationService from '@/services/notification.service';
import { Status } from '@/constants/enum';

@injectable()
export class BlogService implements IBlogService {
	constructor(
		@inject(TYPES.BlogTagService) private blogTagService: BlogTagService
	) { }

	//TODO: implement pagination
	async findAll(): Promise<BlogDocument[]> {
		try {
			const blogs = await BlogModel.find()
				.populate('tags') // Add this to include tags
				.populate({
					path: 'author',
					select: 'name email image',
					model: 'User' 
				}).lean();
			return blogs as BlogDocument[];
		} catch (error) {
			logger.error(error, 'Error getting blogs');
			throw new InternalServerErrorException(
				'Error getting blogs from database',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async findLastEditedByUser(userId: string): Promise<BlogDocument | null> {
		try {
			const blog = await BlogModel.findOne({
				author: new Types.ObjectId(userId),
			}).sort({ updatedAt: -1 });

			if (!blog) {
				throw new CouldNotFindBlogException();
			}
			return blog.toObject() as BlogDocument;
		} catch (error) {
			logger.error(error, 'Error getting last edited blog');
			throw new InternalServerErrorException(
				'Error getting last edited blog',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async findById(id: string): Promise<BlogDocument | null> {
		try {
			if (!Types.ObjectId.isValid(id)) {
				throw new BadRequestException(
					'Invalid blog id',
					ErrorCode.INVALID_BLOG_ID
				);
			}
			const blog = await BlogModel.findById(id)
			.populate({
				path: 'author',
				select: 'name email image',
				model: 'User' 
			}).lean();

			if (!blog) {
				throw new CouldNotFindBlogException();
			}
			return blog as BlogDocument;
		} catch (error) {
			if (error instanceof BadRequestException) throw error;
			logger.error(error, 'Error getting blog by id');
			throw new InternalServerErrorException(
				'Error getting blog from database',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async create(userId: string, data: CreateBlogDto): Promise<BlogDocument> {
		try {
			const blog = new BlogModel({
				title: data.title,
				content: data.content,
				image: data.image,
				author: new Types.ObjectId(userId),
				status: Status.DRAFT,
				tags: data.tags || []
			});
			logger.info('Creating blog data', blog);
			const newBlog = await blog.save();
			if (data.tags && data.tags.length > 0) {
				await Promise.all(
					data.tags.map(tagName => this.blogTagService.createTag(tagName))
				);
			}
			return newBlog.toObject() as BlogDocument;
		} catch (error) {
			logger.error(error, 'Error creating blog');
			throw new InternalServerErrorException(
				'Error creating blog',
				ErrorCode.DATABASE_ERROR,
				error
			);
		}
	}

	async update({
		blogId,
		userId,
		data,
		role
	}: {
		blogId: string, userId: string, data: UpdateBlogDto, role: string[]
	}): Promise<BlogDocument> {
		try {
			const blog = await BlogModel.findById(blogId);

			if (!blog) {
				throw new CouldNotFindBlogException();
			}

			if (userId !== blog.author.toString() && !role.includes("admin")) {
				throw new UnauthorizedException(
					"You are not authorized to update this blog."
				);
			}

			if (data.tags && data.tags.length > 0) {
				await Promise.all(
					data.tags.map(tagName => this.blogTagService.createTag(tagName))
				);
			}

			let status = blog.status;

			if (data.status) {
				if (data.status === Status.PUBLISHED && !role.includes("admin")) {
					status = Status.PENDING_REVIEW;
				} else {
					status = data.status;
				}
			}


			const updatedBlog = await BlogModel.findByIdAndUpdate(
				blogId,
				{
					title: data.title,
					content: data.content,
					image: data.image,
					status: status,
					tags: data.tags
				},
				{ new: true }
			);

			if (!updatedBlog) {
				throw new BadRequestException(
					'Invalid blog data',
					ErrorCode.INVALID_BLOG_DATA
				);
			}

			return updatedBlog.toObject() as BlogDocument;
		} catch (error) {
			if (
				error instanceof BadRequestException ||
				error instanceof UnauthorizedException ||
				error instanceof CouldNotFindBlogException
			) {
				throw error;
			}
			logger.error(error, 'Error updating blog');
			throw new InternalServerErrorException(
				'Error updating blog',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	//user or admin
	async delete(
		blogId: string,
		userId: string,
		role: string[]
	): Promise<void> {
		try {
			const blog = await BlogModel.findById(blogId);
			if (!blog) {
				throw new CouldNotFindBlogException();
			}

			if (userId !== blog.author.toString() && !role.includes("admin")) {
				throw new UnauthorizedException(
					"You are not authorized to delete this blog."
				);
			}

			await blog.deleteOne();
		} catch (error) {
			if (
				error instanceof BadRequestException ||
				error instanceof UnauthorizedException
			) {
				throw error;
			}
			logger.error(error, "Error deleting blog");
			throw new InternalServerErrorException(
				"Error deleting blog",
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async findPublished(query: any, limit: number): Promise<BlogDocument[]> {
		try {
			const publishedQuery = {
				...query,
				status: Status.PUBLISHED
			};

			const blogs = await BlogModel.find(publishedQuery)
				.limit(limit)
				.sort({ createdAt: -1 })
				.populate({
					path: 'author',
					select: 'name email image',
					model: 'User' 
				}).lean();
			return blogs as BlogDocument[];
		} catch (error) {
			logger.error(error, "Error getting published blogs");
			throw new InternalServerErrorException(
				"Error getting published blogs",
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async countPublished(query: any): Promise<number> {
		try {
			const publishedQuery = {
				...query,
				status: Status.PUBLISHED
			};

			const total = await BlogModel.countDocuments(publishedQuery);
			return total;
		} catch (error) {
			logger.error(error, "Error getting total published blogs");
			throw new InternalServerErrorException(
				"Error getting total published blogs",
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async updateTags(blogId: string, tags: string[]): Promise<BlogDocument> {
		try {
			const blog = await BlogModel.findById(blogId);
			if (!blog) {
				throw new CouldNotFindBlogException();
			}

			const updatedBlog = await BlogModel.findByIdAndUpdate(
				blogId,
				{ tags },
				{ new: true }
			);

			if (!updatedBlog) {
				throw new BadRequestException(
					'Invalid blog data',
					ErrorCode.INVALID_BLOG_DATA
				);
			}

			return updatedBlog.toObject() as BlogDocument;
		} catch (error) {
			logger.error(error, 'Error updating blog tags');
			throw new InternalServerErrorException(
				'Error updating blog tags',
				ErrorCode.DATABASE_ERROR
			);
		}
	}


	async approve(blogId: string): Promise<BlogDocument> {
		try {
			const blog = await BlogModel.findById(blogId).populate({
				path: 'author',
				select: 'name email image',
				model: 'User'
			});
			if (!blog) {
				throw new CouldNotFindBlogException();
			}

			if (blog.status !== Status.PENDING_REVIEW) {
				throw new BadRequestException(
					'Invalid blog status',
					ErrorCode.INVALID_BLOG_STATUS
				);
			}
			const updatedBlog = await BlogModel.findByIdAndUpdate(
				blogId,
				{
					status: Status.PUBLISHED
				},
				{ new: true }
			).populate({
				path: 'author',
				select: 'name email image',
				model: 'User'
			});
			if (!updatedBlog) {
				throw new BadRequestException(
					'Failed to approve blog',
					ErrorCode.INVALID_BLOG_DATA
				);
			}

			if (blog.author) {
				await NotificationService.createNotification({
					title: 'Blog Approved',
					content: `Your blog "${blog.title}" has been approved and published.`,
					userId: blog.author._id.toString()
				});
			}

			return updatedBlog.toObject() as BlogDocument;

		} catch (error) {
			logger.error(error, 'Error approving blog');
			throw new InternalServerErrorException(
				'Error approving blog',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async reject(blogId: string, data: RejectBlogDto): Promise<void> {
		try {
			const { reason } = data;
			const blog = await BlogModel.findById(blogId).populate({
				path: 'author',
				select: 'name email image',
				model: 'User'
			});
			if (!blog) {
				throw new CouldNotFindBlogException();
			}

			if (blog.status !== Status.PENDING_REVIEW) {
				throw new BadRequestException(
					'Invalid blog status',
					ErrorCode.INVALID_BLOG_STATUS
				);
			}

			// Update blog with rejected status
			await BlogModel.findByIdAndUpdate(
				blogId,
				{
					status: Status.REJECTED
				}
			);

			// Send notification to the blog author with rejection reason
			if (blog.author) {
				await NotificationService.createNotification({
					title: 'Blog Rejected',
					content: `Your blog "${blog.title}" has been rejected. Reason: ${reason}`,
					userId: blog.author._id.toString()
				});
			}

			logger.info(`Blog ${blogId} rejected. Reason: ${reason}`);
		} catch (error) {
			if (
				error instanceof BadRequestException ||
				error instanceof CouldNotFindBlogException
			) {
				throw error;
			}
			logger.error(error, 'Error rejecting blog');
			throw new InternalServerErrorException(
				'Error rejecting blog',
				ErrorCode.DATABASE_ERROR
			);
		}
	}


	async requestPublish(blogId: string, userId: string): Promise<BlogDocument> {
		try {
			const blog = await BlogModel.findById(blogId);
			if (!blog) {
				throw new CouldNotFindBlogException();
			}

			if (userId !== blog.author.toString()) {
				throw new UnauthorizedException(
					"You are not authorized to request publish this blog."
				);
			}

			const updatedBlog = await BlogModel.findByIdAndUpdate(
				blogId,
				{
					status: Status.PENDING_REVIEW
				},
				{ new: true }
			)

			if (!updatedBlog) {
				throw new BadRequestException(
					'Failed to submit blog for review',
					ErrorCode.INVALID_BLOG_DATA
				);
			}

			return updatedBlog.toObject() as BlogDocument;
		} catch (error) {
			if (
				error instanceof BadRequestException ||
				error instanceof UnauthorizedException ||
				error instanceof CouldNotFindBlogException
			) {
				throw error;
			}
			logger.error(error, 'Error requesting blog publishing');
			throw new InternalServerErrorException(
				'Error requesting blog publishing',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async find(options: {
		page?: number;
		limit?: number;
		sort?: Record<string, 1 | -1>;
		filter?: Record<string, any>;
		userId?: string;
		status?: Status | Status[];
		search?: string;
	}): Promise<{
		blogs: BlogDocument[],
		pagination: {
			total: number;
			page: number;
			limit: number;
			pages: number;
			hasNext: boolean;
			hasPrev: boolean;
		}
	}> {
		try {
			const { page = 1, limit = 10, sort = { createdAt: -1 }, filter = {}, userId, status, search } = options;

			// Build query filters
			const query: Record<string, any> = { ...filter };

			if (userId) {
				query.author = new Types.ObjectId(userId);
			}

			if (status) {
				if (Array.isArray(status)) {
					query.status = { $in: status };
				} else {
					query.status = status;
				}
			}

			if (search) {
				query.$or = [
					{ title: { $regex: search, $options: 'i' } },
					{ content: { $regex: search, $options: 'i' } }
				];
			}

			// Calculate pagination
			const skip = (page - 1) * limit;

			// Execute query
			const blogs = await BlogModel.find(query)
				.sort(sort)
				.skip(skip)
				.limit(limit)
				.populate({
					path: 'author',
					select: 'name email image',
					model: 'User' 
				})
				.populate('tags')
				.lean();

			const total = await BlogModel.countDocuments(query);
			const pages = Math.ceil(total / limit);
			const hasNext = page < pages;
			const hasPrev = page > 1;
		
			return {
				blogs: blogs as BlogDocument[],
				pagination: {
					total,
					page,
					limit,
					pages,
					hasNext,
					hasPrev
				}
			};
		} catch (error) {
			logger.error(error, "Error finding blogs");
			throw new InternalServerErrorException(
				"Error finding blogs",
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async addHeart(blogId: string, userId: string): Promise<Blog> {
		try {
			const updatedBlog = await BlogModel.findByIdAndUpdate(
				blogId,
				{ $addToSet: { hearts: userId } },
				{ new: true }
			);
	
			if (!updatedBlog) {
				throw new CouldNotFindBlogException();
			}
	
			return updatedBlog;
		} catch (error) {
			logger.error(error, 'Error adding heart');
			throw new InternalServerErrorException(
				'Error adding heart to blog',
				ErrorCode.DATABASE_ERROR
			);
		}
	}
	

	async removeHeart(blogId: string, userId: string): Promise<Blog> {
		try {
			const updatedBlog = await BlogModel.findByIdAndUpdate(
				blogId,
				{ $pull: { hearts: userId } },
				{ new: true }
			);
	
			if (!updatedBlog) {
				throw new CouldNotFindBlogException();
			}
	
			return updatedBlog;
		} catch (error) {
			logger.error(error, 'Error removing heart');
			throw new InternalServerErrorException(
				'Error removing heart from blog',
				ErrorCode.DATABASE_ERROR
			);
		}
	}
	
	async getHeartCount(blogId: string): Promise<number> {
		try {
			const blog = await BlogModel.findById(blogId).select('hearts');
			if (!blog) {
				throw new CouldNotFindBlogException();
			}
			return blog.hearts.length;
		} catch (error) {
			logger.error(error, 'Error getting heart count');
			throw new InternalServerErrorException(
				'Error getting heart count',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async isHeart(blogId: string, userId: string): Promise<boolean> {
		try {
			const blog = await BlogModel.findById(blogId).select('hearts');
			if (!blog) {
				throw new CouldNotFindBlogException();
			}
			// Chuyển ObjectId về string để so sánh
			return blog.hearts.map(id => id.toString()).includes(userId);
		} catch (error) {
			logger.error(error, 'Error checking heart status');
			throw new InternalServerErrorException(
				'Error checking heart status',
				ErrorCode.DATABASE_ERROR
			);
		}
	}
	
	async getHeartUsers(blogId: string): Promise<string[]> {
		try {
			const blog = await BlogModel.findById(blogId).select('hearts');
			if (!blog) {
				throw new CouldNotFindBlogException();
			}
			// Chuyển đổi ObjectId[] thành string[]
			return blog.hearts.map(id => id.toString());
		} catch (error) {
			logger.error(error, 'Error fetching heart users');
			throw new InternalServerErrorException(
				'Error fetching heart users',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

}
