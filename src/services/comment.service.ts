  // comment.service.ts
  import { injectable } from "inversify";
import CommentModel, { CommentDocument } from "@/models/comment.model";
import { ICommentService } from "@/interfaces/service.interface";
import { Types } from "mongoose";

@injectable()
export class CommentService implements ICommentService {
  async createComment(
    userId: string,
    blogId: string,
    content: string,
    parentId?: string
  ): Promise<CommentDocument> {
    const comment = new CommentModel({
      author: new Types.ObjectId(userId),
      blog: new Types.ObjectId(blogId),
      content,
      parentId: parentId ? new Types.ObjectId(parentId) : null, // Gán parentId nếu có
    });
  
    const savedComment = await comment.save();
  
    // Nếu có parentId, cập nhật replies của comment cha
    if (parentId) {
      await CommentModel.findByIdAndUpdate(parentId, {
        $push: { replies: savedComment._id },
      });
    }
  
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

  async updateComment(
    commentId: string,
    userId: string,
    content?: string,
    replies?: Types.ObjectId[]
  ): Promise<CommentDocument> {
    // Tìm comment cần update
    const comment = await CommentModel.findById(commentId);
    if (!comment) throw new Error("Comment not found");
  
    if (content && comment.author.toString() !== userId) {
      throw new Error("Unauthorized to update content");
    }
  
    if (content) {
      comment.content = content;
    }
  
    if (replies) {
      comment.replies = replies;
    }
  
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
