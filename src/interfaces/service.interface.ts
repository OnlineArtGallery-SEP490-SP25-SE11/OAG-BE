/* eslint-disable no-unused-vars */
import { CreateBlogDto, UpdateBlogDto } from '@/dto/blog.dto';
import { Blog, BlogDocument } from '@/models/blog.model';
import { ArtworkQueryOptions } from '@/services/artwork.service.ts';
import Artwork from '@/models/artwork.model.ts';
import Collection from '@/models/collection.model.ts';
import { UpdateCollectionOptions } from '@/services/collection.service.ts';

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

export interface IArtworkService {
	add(
		title: string,
		description: string,
		category: [string],
		dimensions: {
			width: number;
			height: number;
		},
		url: string,
		status: string,
		price: number
	): Promise<InstanceType<typeof Artwork>>;

	get(
		options: ArtworkQueryOptions,
		skip: number,
		take: number
	): Promise<InstanceType<typeof Artwork>[]>;
}

export interface ICollectionService {
	add(
		title: string,
		description: string,
		artworks?: string[]
	): Promise<InstanceType<typeof Collection>>;
	get(
		id?: string
	): Promise<
		InstanceType<typeof Collection> | InstanceType<typeof Collection>[]>;
	update(
		options: UpdateCollectionOptions
	): Promise<InstanceType<typeof Collection>>;
}
