// comment.controller.ts
import { BaseHttpResponse } from "@/lib/base-http-response";
import { ForbiddenException } from "@/exceptions/http-exception";
import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/constants/types";
import { ICommentController } from "@/interfaces/controller.interface";
import { CreateCommentDto, UpdateCommentDto } from "@/dto/comment.dto";
import { CommentService } from "@/services/comment.service";
import { Types } from "mongoose";

@injectable()
export class CommentController implements ICommentController {
  constructor(
    @inject(TYPES.CommentService)
    private readonly commentService: CommentService
  ) {
    this.create = this.create.bind(this);
    this.getCommentsByTarget = this.getCommentsByTarget.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  // ✅ Tạo comment mới
  create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { targetId, content, targetType, parentId, onModel } = req.validatedData as CreateCommentDto; // Thêm onModel
      const userId = req.userId;
      if (!userId) throw new ForbiddenException("Forbidden");
  
      const comment = await this.commentService.createComment(
        userId,
        targetId,
        content,
        targetType,
        onModel,
        parentId
      );
  
      const response = BaseHttpResponse.success(comment, 201, "Comment created successfully");
      return res.status(response.statusCode).json(response.data);
    } catch (error) {
      next(error);
    }
  };
  

// ✅ Lấy danh sách comment theo target (blog/artwork) trong controller 
getCommentsByTarget = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const targetId = req.params.targetId; // Lấy targetId từ tham số URL
    const targetType = req.params.targetType as 'blog' | 'artwork'; // Lấy targetType từ tham số URL

    // Kiểm tra giá trị của targetType
    if (targetType !== 'blog' && targetType !== 'artwork') {
      throw new Error("Invalid targetType (must be 'blog' or 'artwork')");
    }

    // Lấy danh sách comment từ service
    const comments = await this.commentService.getCommentsByTarget(targetId, targetType);

    // Tạo phản hồi thành công
    const response = BaseHttpResponse.success(comments, 200, "Comments fetched successfully");
    return res.status(response.statusCode).json(response.data);
  } catch (error) {
    next(error); // Xử lý lỗi nếu có
  }
};


  // Không cần chỉnh sửa gì ở update và delete, giữ nguyên
  update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const commentId = req.params.id;
      const userId = req.userId;
      if (!userId) throw new ForbiddenException("Forbidden");

      const { content, replies } = req.validatedData as UpdateCommentDto;

      const repliesObjectIds = replies?.map((replyId) => new Types.ObjectId(replyId));

      const updatedComment = await this.commentService.updateComment(
        commentId,
        userId,
        content,
        repliesObjectIds
      );

      const response = BaseHttpResponse.success(updatedComment, 200, "Comment updated successfully");
      return res.status(response.statusCode).json(response.data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const commentId = req.params.id;
      const userId = req.userId;
      const role = req.userRole ?? [];
      if (!userId) throw new ForbiddenException("Forbidden");

      await this.commentService.deleteComment(commentId, userId, role);

      const response = BaseHttpResponse.success(null, 204, "Comment deleted successfully");
      return res.status(response.statusCode).json(response.data);
    } catch (error) {
      next(error);
    }
  };
}
