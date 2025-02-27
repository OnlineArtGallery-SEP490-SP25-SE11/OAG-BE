/* eslint-disable no-unused-vars */
import { CreateBlogDto, RejectBlogDto, UpdateBlogDto } from "@/dto/blog.dto";
import { BlogTag } from "@/models/blog-tag.model";
import { Blog, BlogDocument } from "@/models/blog.model";

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
  findPublished(query: any, limit: number): Promise<BlogDocument[]>;
  countPublished(query: any): Promise<number>;
  updateTags(blogId: string, tags: string[]): Promise<Blog>;
  approve(blogId: string): Promise<Blog>;
  reject(blogId: string, data: RejectBlogDto): Promise<void>;
  requestPublish(blogId: string, userId: string): Promise<Blog>;
}



export interface IInteractionService {
  getUserInteractions(userId: string, blogId: string): Promise<{
    hearted: boolean;
  }>;
}
