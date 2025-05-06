import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/constants/types";
import { IChatController } from "@/interfaces/controller.interface";
import { ChatService } from "@/services/chat.service";


@injectable()
export class ChatController implements IChatController {
  constructor(@inject(TYPES.ChatService) private chatService: ChatService) {}


  // Gửi tin nhắn
  async createChat(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { senderId, receiverId, message, replyTo } = req.body;
      const chat = await this.chatService.createChat(senderId, receiverId, message, replyTo);
      return res.status(201).json(chat);
    } catch (err) {
      next(err);
    }
  }

  // Lấy tin nhắn giữa 2 user
  async getChatHistory(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { sender, receiver } = req.params;
      console.log('Fetching chat history for:', sender, receiver);
  
      const messages = await this.chatService.getChatHistory(sender, receiver);
      console.log('Messages:', messages);
  
      return res.status(200).json(messages);
    } catch (err) {
      console.error('Error in getChatHistory:', err);
      next(err);
    }
  }
  

  // Lấy danh sách người dùng đã nhắn tin
  async getChatList(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { userId } = req.params;
      const chatList = await this.chatService.getChatList(userId);
      return res.status(200).json(chatList);
    } catch (err) {
      next(err);
    }
  }

  // Lấy tin nhắn cuối cùng giữa các user
  async getLastMessageWithUsers(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { userId } = req.params;
      const conversations = await this.chatService.getLastMessageWithUsers(userId);
      return res.status(200).json(conversations);
    } catch (err) {
      next(err);
    }
  }

  // Đánh dấu tin nhắn đã đọc
  async markMessageAsRead(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { chatId, userId } = req.body;
      const updatedChat = await this.chatService.markMessageAsRead(chatId, userId);
      return res.status(200).json(updatedChat);
    } catch (err) {
      next(err);
    }
  }

  // Đánh dấu tất cả tin nhắn là đã đọc
  async markAllMessagesAsRead(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { userId1, userId2 } = req.body;
      await this.chatService.markAllMessagesAsRead(userId1, userId2);
      return res.status(200).json({ message: "All messages marked as read" });
    } catch (err) {
      next(err);
    }
  }

  // Xóa tin nhắn
  async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { chatId, userId } = req.body;
      await this.chatService.deleteMessage(chatId, userId);
      return res.status(200).json({ message: "Message deleted" });
    } catch (err) {
      next(err);
    }
  }

  // Xóa đoạn chat giữa 2 người
  async deleteChat(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { userId1, userId2 } = req.body;
      await this.chatService.deleteChat(userId1, userId2);
      return res.status(200).json({ message: "Chat deleted" });
    } catch (err) {
      next(err);
    }
  }
}
