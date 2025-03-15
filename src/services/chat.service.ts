import { injectable } from "inversify";
import ChatModel, { ChatDocument } from "@/models/chat.model";
import { Types } from "mongoose";
import { IChatService } from "@/interfaces/service.interface";
import chatModel from "@/models/chat.model";
import logger from "@/configs/logger.config";

@injectable()
export class ChatService implements IChatService {
  // Tạo hoặc gửi tin nhắn mới
  async createChat(
    senderId: string,
    receiverId: string,
    message: string,
    replyTo?: string
  ): Promise<ChatDocument> {
    const conversationId = [senderId, receiverId].sort().join("_");

    const chat = new ChatModel({
      sender: new Types.ObjectId(senderId),
      receiver: new Types.ObjectId(receiverId),
      message,
      conversationId,
      replyTo: replyTo ? new Types.ObjectId(replyTo) : null,
    });

    const savedChat = await chat.save();

    if (replyTo) {
      await ChatModel.findByIdAndUpdate(replyTo, {
        $push: { replies: savedChat._id },
      });
    }

    return savedChat.toObject() as ChatDocument;
  }

  // Lấy lịch sử tin nhắn giữa 2 người dùng
  async getChatHistory(sender: string, receiver: string): Promise<ChatDocument[]> {

    const conversationId = [sender, sender].sort().join("_");

    const chatHistory = await chatModel.find({
      receiver,sender
    })
    .populate({ path: "sender", select: "name email image" , model: 'User'})
    .populate({ path: "receiver", select: "name email image" , model: 'User'})

    logger.debug(chatHistory);
    return chatHistory;
  }

  // Lấy danh sách các cuộc trò chuyện của người dùng
  async getChatList(userId: string): Promise<ChatDocument[]> {
    return await ChatModel.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  // Lấy tin nhắn cuối cùng của mỗi cuộc trò chuyện
  async getLastMessageWithUsers(userId: string): Promise<{ userId: string; lastMessage: ChatDocument }[]> {
    const conversations = await ChatModel.aggregate([
      {
        $match: {
          $or: [
            { sender: new Types.ObjectId(userId) },
            { receiver: new Types.ObjectId(userId) },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
        },
      },
    ]);

    return conversations.map((conv) => ({
      userId: conv._id,
      lastMessage: conv.lastMessage,
    }));
  }

  // Đánh dấu tin nhắn là đã đọc
  async markMessageAsRead(chatId: string, userId: string): Promise<ChatDocument> {
    const chat = await ChatModel.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    if (chat.receiver.toString() !== userId) {
      throw new Error("Unauthorized to mark as read");
    }

    chat.isRead = true;
    const updatedChat = await chat.save();
    return updatedChat.toObject() as ChatDocument;
  }

  // Đánh dấu tất cả tin nhắn là đã đọc trong cuộc trò chuyện
  async markAllMessagesAsRead(userId: string, contactId: string): Promise<void> {
    const conversationId = [userId, contactId].sort().join("_");

    await ChatModel.updateMany(
      { conversationId, receiver: userId, isRead: false },
      { isRead: true }
    );
  }

  // Xóa tin nhắn (soft delete)
  async deleteMessage(chatId: string, userId: string): Promise<void> {
    const chat = await ChatModel.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    if (!chat.deletedBy.includes(new Types.ObjectId(userId))) {
      chat.deletedBy.push(new Types.ObjectId(userId));
      await chat.save();
    }
  }

  // Xóa toàn bộ cuộc trò chuyện
  async deleteChat(userId: string, contactId: string): Promise<void> {
    const conversationId = [userId, contactId].sort().join("_");
    await ChatModel.updateMany(
      { conversationId },
      { $addToSet: { deletedBy: new Types.ObjectId(userId) } }
    );
  }
}
