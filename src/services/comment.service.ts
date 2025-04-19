// comment.service.ts
import { injectable } from "inversify";
import { injectable } from "inversify";
import CommentModel, { CommentDocument } from "@/models/comment.model";
import { ICommentService } from "@/interfaces/service.interface";
import { Types } from "mongoose";

@injectable()
export class CommentService implements ICommentService {
  async createComment(
    userId: string,
    targetId: string,
    content: string,
    targetType: 'blog' | 'artwork',
    onModel: 'blog' | 'artwork',
    parentId?: string | null
  ): Promise<CommentDocument> {
    const comment = new CommentModel({
      author: new Types.ObjectId(userId),
      target: new Types.ObjectId(targetId),
      targetType,
      content,
      onModel,  // Thêm onModel vào đây
      parentComment: parentId ? new Types.ObjectId(parentId) : undefined,
    });

    const savedComment = await comment.save();
  
    // Nếu có parentId thì push vào replies của comment cha
    if (parentId) {
      await CommentModel.findByIdAndUpdate(parentId, {
        $push: { replies: savedComment._id },
      });
    }

    return savedComment.toObject() as CommentDocument;
  }
  
  async getCommentsByTarget(
    targetId: string,
    targetType: 'blog' | 'artwork'
  ): Promise<CommentDocument[]> {
    // Kiểm tra chuyển đổi ObjectId đúng
    const objectId = new Types.ObjectId(targetId); // Convert targetId thành ObjectId
  
    return await CommentModel.find({
      target: objectId,
      onModel: targetType,
    })
      .populate({
        path: 'author',
        select: 'name email image',
        model: 'User',
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
    const comment = await CommentModel.findById(commentId);
    if (!comment) throw new Error("Comment not found");


    if (content && comment.author.toString() !== userId) {
      throw new Error("Unauthorized to update content");
    }

    if (content) comment.content = content;
    if (replies) comment.replies = replies;

    const updatedComment = await comment.save();
    return updatedComment.toObject() as CommentDocument;
  }

  async deleteComment(
    commentId: string,
    userId: string,
    role: string[]
  ): Promise<void> {
    const comment = await CommentModel.findById(commentId);
    if (!comment) throw new Error("Comment not found");

    if (comment.author.toString() !== userId && !role.includes("admin")) {
      throw new Error("Unauthorized");
    }

    await comment.deleteOne();
  }
}
