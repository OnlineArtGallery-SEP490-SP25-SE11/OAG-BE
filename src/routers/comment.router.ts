import { Router } from "express";
import roleRequire from "@/configs/middleware.config";
import { Role } from "@/constants/enum";
import { TYPES } from "@/constants/types";
import { CommentController } from "@/controllers/comment.controller";
import container from "@/configs/container.config";
import { validate } from "@/middlewares/validate.middleware";
import { CreateCommentSchema, UpdateCommentSchema } from "@/dto/comment.dto";
import permanentBan from '@/configs/middleware.config';

const router = Router();
const commentController = container.get<CommentController>(TYPES.CommentController);

// Tạo comment mới (cho blog hoặc artwork)
router.post(
  "/",
  roleRequire([Role.ARTIST, Role.USER]),
  validate(CreateCommentSchema),
  permanentBan(),
  commentController.create
);

router.get(
  "/target/:targetType/:targetId", // targetType: "blog" | "artwork"
  commentController.getCommentsByTarget
);

// Cập nhật comment (chỉ tác giả comment)
router.put(
  "/:id",
  roleRequire([Role.ARTIST, Role.USER]),
  validate(UpdateCommentSchema),
  commentController.update
);

// Xoá comment (tác giả hoặc admin)
router.delete(
  "/:id",
  roleRequire([Role.USER, Role.ARTIST]),
  commentController.delete
);

export default router;
