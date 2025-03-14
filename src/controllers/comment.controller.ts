//comment.controller.ts
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
export class CommentController implements ICommentController{
  constructor(
    @inject(TYPES.CommentService) private readonly commentService: CommentService
  ) {
    this.create = this.create.bind(this);
    this.getComments = this.getComments.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  // Tạo comment mới
create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // Lấy dữ liệu từ request
    const { blogId, content, parentId } = req.validatedData as CreateCommentDto;
    const userId = req.userId;
    if (!userId) throw new ForbiddenException("Forbidden");

    // Gọi service để tạo comment hoặc reply
    const comment = await this.commentService.createComment(userId, blogId, content, parentId);

    // Trả về response
    const response = BaseHttpResponse.success(comment, 201, "Comment created successfully");
    return res.status(response.statusCode).json(response.data);
  } catch (error) {
    next(error);
  }
};



  // Lấy danh sách comment theo blog
  getComments = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const blogId = req.params.blogId;
      const comments = await this.commentService.getCommentsByBlog(blogId);
      const response = BaseHttpResponse.success(comments, 200, "Comments fetched successfully");
      return res.status(response.statusCode).json(response.data);
    } catch (error) {
      next(error);
    }
  };


  update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const commentId = req.params.id;
      const userId = req.userId;
      if (!userId) throw new ForbiddenException("Forbidden");
  
      const { content, replies } = req.validatedData as UpdateCommentDto;
  
      // Chuyển đổi replies (string[]) sang ObjectId[]
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
  

  // Xoá comment
  delete = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const commentId = req.params.id;
      const userId = req.userId;
      const role = req.userRole ?? []; // nếu req.userRole undefined thì dùng []
      if (!userId) throw new ForbiddenException("Forbidden");
      await this.commentService.deleteComment(commentId, userId, role);
      const response = BaseHttpResponse.success(null, 204, "Comment deleted successfully");
      return res.status(response.statusCode).json(response.data);
    } catch (error) {
      next(error);
    }
  };
}
