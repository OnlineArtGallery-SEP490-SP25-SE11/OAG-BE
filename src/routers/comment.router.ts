//comment.route.ts
import { Router } from "express";
import roleRequire from "@/configs/middleware.config";
import { Role } from "@/constants/enum";
import { TYPES } from "@/constants/types";
import { CommentController } from "@/controllers/comment.controller";
import container from "@/configs/container.config";
import { validate } from "@/middlewares/validate.middleware";
import { CreateCommentSchema, UpdateCommentSchema } from "@/dto/comment.dto";

const router = Router();
const commentController = container.get<CommentController>(TYPES.CommentController);

// Tạo comment mới (dành cho Artist, USER)
router.post(
  "/",
  roleRequire([Role.ARTIST, Role.USER]),
  validate(CreateCommentSchema),
  commentController.create
);

// Lấy danh sách comment theo blog (blogId truyền qua route parameter)
router.get("/blog/:blogId", commentController.getComments);

// Cập nhật comment (dành cho tác giả hoặc USER)
router.put(
  "/:id",
  roleRequire([Role.ARTIST, Role.USER]),
  validate(UpdateCommentSchema),
  commentController.update
);

// Xoá comment (dành cho tác giả hoặc USER)
router.delete(
  "/:id",
  roleRequire([Role.ARTIST, Role.USER]),
  commentController.delete
);

export default router;
