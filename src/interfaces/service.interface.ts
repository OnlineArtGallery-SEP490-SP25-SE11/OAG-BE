/* eslint-disable no-unused-vars */
import { CreateBlogDto, UpdateBlogDto } from '@/dto/blog.dto';
import { Blog, BlogDocument } from '@/models/blog.model';

export interface IBlogService {
	getBlogs(): Promise<Blog[]>;
	getBlogById(id: string): Promise<Blog | null>;
	getLastEditedBlog(userId: string): Promise<Blog | null>;
	createBlog(data: CreateBlogDto): Promise<Blog>;
	updateBlog(data: UpdateBlogDto, role: string[]): Promise<Blog>;
	deleteBlog(blogId: string, userId: string, role: string[]): Promise<void>;
	getPublishedBlogs(query: any, limit: number): Promise<BlogDocument[]>;
	getTotalPublishedBlogs(query: any): Promise<number>;
}

export interface IInteractionService {
	getUserInteractions(
		userId: string,
		blogId: string
	): Promise<{
		hearted: boolean;
	}>;
}
