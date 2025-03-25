// service.interface.ts
import { CreateBlogDto, RejectBlogDto, UpdateBlogDto } from "@/dto/blog.dto";
import { BlogTag } from "@/models/blog-tag.model";
import { BlogDocument } from "@/models/blog.model";
import { CommentDocument } from "@/models/comment.model";
/* eslint-disable no-unused-vars */
import { Status } from "@/constants/enum";
import Artwork from '@/models/artwork.model.ts';
import Collection from '@/models/collection.model.ts';
import { ArtworkQueryOptions } from '@/services/artwork.service.ts';
import { UpdateCollectionOptions } from '@/services/collection.service.ts';

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
export interface IBlogTagService {
	createTag(name: string): Promise<BlogTag>;
	getTags(): Promise<BlogTag[]>;
	deleteTag(id: string): Promise<void>;
}

export interface IBlogService {
	findAll(): Promise<BlogDocument[]>;
	findById(id: string): Promise<BlogDocument | null>;
	findLastEditedByUser(userId: string): Promise<BlogDocument | null>;
	create(userId: string, data: CreateBlogDto): Promise<BlogDocument>;
	update({
		blogId,
		userId,
		data,
		role
	}: {
		blogId: string;
		userId: string;
		data: UpdateBlogDto;
		role: string[];
	}): Promise<BlogDocument>;
	delete(blogId: string, userId: string, role: string[]): Promise<void>;
	findPublished(query: any, limit: number): Promise<BlogDocument[]>;
	countPublished(query: any): Promise<number>;
	updateTags(blogId: string, tags: string[]): Promise<BlogDocument>;
	approve(blogId: string): Promise<BlogDocument>;
	reject(blogId: string, data: RejectBlogDto): Promise<void>;
	requestPublish(blogId: string, userId: string): Promise<BlogDocument>;
	find(option: {
		page?: number;
		limit?: number;
		sort?: Record<string, 1 | -1>;
		filter?: Record<string, any>;
		userId?: string;
		status?: Status | Status[];
		search?: string;
	}): Promise<{
		blogs: BlogDocument[];
		pagination: {
			total: number;
			page: number;
			limit: number;
			pages: number;
			hasNext: boolean;
			hasPrev: boolean;
		};
	}>;
}

export interface IInteractionService {
  getUserInteractions(
    userId: string,
    blogId: string
  ): Promise<{
    hearted: boolean;
  }>;
}

export interface ICommentService {
  createComment(userId: string, blogId: string, content: string): Promise<CommentDocument>;
  getCommentsByBlog(blogId: string): Promise<CommentDocument[]>;
  updateComment(commentId: string, userId: string, content: string): Promise<CommentDocument>;
  deleteComment(commentId: string, userId: string, role: string[]): Promise<void>;
}
