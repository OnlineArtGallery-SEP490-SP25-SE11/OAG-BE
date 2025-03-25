// service.interface.ts
import { CreateBlogDto, RejectBlogDto, UpdateBlogDto } from "@/dto/blog.dto";
import { BlogTag } from "@/models/blog-tag.model";
import { Blog } from "@/models/blog.model";
import { CommentDocument } from "@/models/comment.model";
/* eslint-disable no-unused-vars */
import { Status } from "@/constants/enum";
import Artwork from '@/models/artwork.model.ts';
import Collection from '@/models/collection.model.ts';
import { ArtworkQueryOptions } from '@/services/artwork.service.ts';
import { UpdateCollectionOptions } from '@/services/collection.service.ts';
import { ChatDocument } from "@/models/chat.model";
// export interface IBlogService {
// 	getBlogs(): Promise<Blog[]>;

// 	getBlogById(id: string): Promise<Blog | null>;

// 	getLastEditedBlog(userId: string): Promise<Blog | null>;

// 	createBlog(data: CreateBlogDto): Promise<Blog>;

// 	updateBlog(data: UpdateBlogDto, role: string[]): Promise<Blog>;

// 	deleteBlog(blogId: string, userId: string, role: string[]): Promise<void>;

// 	getPublishedBlogs(query: any, limit: number): Promise<BlogDocument[]>;

// 	getTotalPublishedBlogs(query: any): Promise<number>;
// }

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
	findAll(): Promise<Blog[]>;
	findById(id: string): Promise<Blog | null>;
	findLastEditedByUser(userId: string): Promise<Blog | null>;
	create(userId: string, data: CreateBlogDto): Promise<Blog>;
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
	}): Promise<Blog>;
	delete(blogId: string, userId: string, role: string[]): Promise<void>;
	findPublished(query: any, limit: number): Promise<Blog[]>;
	countPublished(query: any): Promise<number>;
	updateTags(blogId: string, tags: string[]): Promise<Blog>;
	approve(blogId: string): Promise<Blog>;
	reject(blogId: string, data: RejectBlogDto): Promise<void>;
	requestPublish(blogId: string, userId: string): Promise<Blog>;
	find(option: {
		page?: number;
		limit?: number;
		sort?: Record<string, 1 | -1>;
		filter?: Record<string, any>;
		userId?: string;
		status?: Status | Status[];
		search?: string;
	}): Promise<{
		blogs: Blog[];
		pagination: {
			total: number;
			page: number;
			limit: number;
			pages: number;
			hasNext: boolean;
			hasPrev: boolean;
		};
	}>;
	addHeart(blogId: string, userId: string): Promise<Blog>;
	removeHeart(blogId: string, userId: string): Promise<Blog>;
	getHeartCount(blogId: string): Promise<number>;
	isHeart(blogId: string, userId: string): Promise<boolean>;
	getHeartUsers(blogId: string): Promise<string[]>;
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

export interface IChatService {
	createChat(senderId: string, receiverId: string, message: string, replyTo?: string): Promise<ChatDocument>;
	getChatHistory(userId: string, recipientId: string): Promise<ChatDocument[]>;
	getChatList(userId: string): Promise<ChatDocument[]>;
	getLastMessageWithUsers(userId: string): Promise<{ userId: string; lastMessage: ChatDocument }[]>;
	markMessageAsRead(chatId: string, userId: string): Promise<ChatDocument>;
	markAllMessagesAsRead(userId: string, contactId: string): Promise<void>;
	deleteMessage(chatId: string, userId: string): Promise<void>;
	deleteChat(userId: string, contactId: string): Promise<void>;
}
