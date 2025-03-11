  // comment.service.ts
  import { injectable } from "inversify";
  import CommentModel, { CommentDocument } from "@/models/comment.model";
  import { ICommentService } from "@/interfaces/service.interface";
  import { Types } from "mongoose";
  
  @injectable()
  export class CommentService implements ICommentService {
    async createComment(userId: string, blogId: string, content: string): Promise<CommentDocument> {
      const comment = new CommentModel({
        author: new Types.ObjectId(userId),
        blog: new Types.ObjectId(blogId),
        content,
      });
      const savedComment = await comment.save();
      return savedComment.toObject() as CommentDocument;
    }
  
    async getCommentsByBlog(blogId: string): Promise<CommentDocument[]> {
      return await CommentModel.find({ blog: new Types.ObjectId(blogId) })
      .populate({
				path: 'author',
				select: 'name email image',
				model: 'User' 
			})
      .sort({ createdAt: -1 })
      .lean();
    }
  
    async updateComment(commentId: string, userId: string, content: string): Promise<CommentDocument> {
      const comment = await CommentModel.findById(commentId);
      if (!comment) throw new Error("Comment not found");
      if (comment.author.toString() !== userId) throw new Error("Unauthorized");
  
      comment.content = content;
      const updatedComment = await comment.save();
      return updatedComment.toObject() as CommentDocument;
    }
  
    async deleteComment(commentId: string, userId: string, role: string[]): Promise<void> {
      const comment = await CommentModel.findById(commentId);
      if (!comment) throw new Error("Comment not found");
      if (comment.author.toString() !== userId && !role.includes("admin")) throw new Error("Unauthorized");
  
      await comment.deleteOne();
    }
  }