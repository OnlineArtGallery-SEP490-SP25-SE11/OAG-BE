import { Router } from "express";
import roleRequire from "@/configs/middleware.config";
import { Role } from "@/constants/enum";
import { TYPES } from "@/constants/types";
import { ChatController } from "@/controllers/chat.controller";
import container from "@/configs/container.config";
import { validate } from "@/middlewares/validate.middleware";
import {
  SendMessageSchema,
  MarkAsReadSchema,
  GetMessagesSchema,
  DeleteMessageSchema,
  GetChatListSchema,
} from "@/dto/chat.dto";
import mongoose from "mongoose";

const router = Router();
const chatController = container.get<ChatController>(TYPES.ChatController);

// Gửi tin nhắn (dành cho Artist, USER)
router.post(
  "/",
  roleRequire([Role.ARTIST, Role.USER]),
  validate(SendMessageSchema),
  (req, res, next) => chatController.createChat(req, res, next)
);

// Lấy tin nhắn giữa 2 người dùng
router.get(
  "/user/:sender/:receiver",
  // validate(GetMessagesSchema),
  (req, res, next) => chatController.getChatHistory(req, res, next)
);

// Lấy danh sách người đã nhắn tin với user
router.get(
  "/list/:userId",
  roleRequire([Role.ARTIST, Role.USER]),
  // validate(GetChatListSchema),
  (req, res, next) => chatController.getChatList(req, res, next)
);

// Lấy tin nhắn cuối cùng giữa các user
router.get(
  "/last-messages/:userId",
  roleRequire([Role.ARTIST, Role.USER]),
  (req, res, next) => chatController.getLastMessageWithUsers(req, res, next)
);

// Đánh dấu tin nhắn đã đọc
router.put(
  "/read",
  roleRequire([Role.ARTIST, Role.USER]),
  validate(MarkAsReadSchema),
  (req, res, next) => chatController.markMessageAsRead(req, res, next)
);

// Đánh dấu tất cả tin nhắn giữa 2 người là đã đọc
router.put(
  "/read/all",
  roleRequire([Role.ARTIST, Role.USER]),
  (req, res, next) => chatController.markAllMessagesAsRead(req, res, next)
);

// Xoá tin nhắn (chỉ cho phép người gửi xoá)
router.delete(
  "/message",
  roleRequire([Role.ARTIST, Role.USER]),
  validate(DeleteMessageSchema),
  (req, res, next) => chatController.deleteMessage(req, res, next)
);

// Xoá đoạn chat giữa 2 người
router.delete(
  "/chat",
  roleRequire([Role.ARTIST, Role.USER]),
  (req, res, next) => chatController.deleteChat(req, res, next)
);

export default router;
