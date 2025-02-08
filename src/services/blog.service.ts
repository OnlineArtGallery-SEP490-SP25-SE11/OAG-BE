import logger from '@/configs/logger.config';
import { ErrorCode } from '@/constants/error-code';
import { CreateBlogDto, UpdateBlogDto } from '@/dto/blog.dto';
import { CouldNotFindBlogException } from '@/exceptions';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from "@/exceptions/http-exception";
import BlogModel, { Blog, BlogDocument } from "@/models/blog.model";
import { Types } from "mongoose";
import { injectable } from "inversify";
@injectable()
export class BlogService {
  constructor(
  ) {}

	//TODO: implement pagination
	async getBlogs() {
		try {
			const blogs = await BlogModel.find();
			return blogs;
		} catch (error) {
			logger.error(error, 'Error getting blogs');
			throw new InternalServerErrorException(
				'Error getting blogs from database',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

  async getLastEditedBlog(userId: string): Promise<Blog | null> {
    try {
      const blog = await BlogModel.findOne({
        author: new Types.ObjectId(userId),
      }).sort({ updatedAt: -1 });

			if (!blog) {
				throw new CouldNotFindBlogException();
			}
			return blog;
		} catch (error) {
			logger.error(error, 'Error getting last edited blog');
			throw new InternalServerErrorException(
				'Error getting last edited blog',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async getBlogById(id: string): Promise<Blog | null> {
		try {
			if (!Types.ObjectId.isValid(id)) {
				throw new BadRequestException(
					'Invalid blog id',
					ErrorCode.INVALID_BLOG_ID
				);
			}
			const blog = await BlogModel.findById(id);
			if (!blog) {
				throw new CouldNotFindBlogException();
			}
			return blog;
		} catch (error) {
			if (error instanceof BadRequestException) throw error;
			logger.error(error, 'Error getting blog by id');
			throw new InternalServerErrorException(
				'Error getting blog from database',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

  async createBlog(data: CreateBlogDto): Promise<Blog> {
    try {
      const blog = new BlogModel({
        title: data.title,
        content: data.content,
        image: data.image,
        author: new Types.ObjectId(data.author),
        published: false,
      });

			logger.info('Creating blog data', blog);

			const newBlog = await blog.save();

			return newBlog;
		} catch (error) {
			logger.error(error, 'Error creating blog');
			throw new InternalServerErrorException(
				'Error creating blog',
				ErrorCode.DATABASE_ERROR,
				error
			);
		}
	}

	async updateBlog(data: UpdateBlogDto, role: string[]): Promise<Blog> {
		try {
			const blog = await BlogModel.findById(data._id);
			if (!blog) {
				throw new CouldNotFindBlogException();
			}

      if (data.author !== blog.author.toString() && !role.includes("admin")) {
        throw new UnauthorizedException(
          "You are not authorized to update this blog."
        );
      }

			const updatedBlog = await BlogModel.findByIdAndUpdate(
				data._id,
				{
					title: data.title,
					content: data.content,
					image: data.image,
					published: data.published
				},
				{ new: true }
			);

			if (!updatedBlog) {
				throw new BadRequestException(
					'Invalid blog data',
					ErrorCode.INVALID_BLOG_DATA
				);
			}

			return updatedBlog;
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
	async deleteBlog(
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

  async getPublishedBlogs(query: any, limit: number): Promise<BlogDocument[]> {
   try {
      const blogs = await BlogModel.find(query)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("author", "name email image");
      return blogs as unknown as BlogDocument[];
    } catch (error) {
      logger.error(error, "Error getting published blogs");
      throw new InternalServerErrorException(
        "Error getting published blogs",
        ErrorCode.DATABASE_ERROR
      );
    }
  }

  async getTotalPublishedBlogs(query: any): Promise<number> {
    try {
      const total = await BlogModel.countDocuments(query);
      return total;
    } catch (error) {
      logger.error(error, "Error getting total published blogs");
      throw new InternalServerErrorException(
        "Error getting total published blogs",
        ErrorCode.DATABASE_ERROR
      );
    }
  }
}
