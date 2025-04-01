//chat.dto.ts
import { z } from "zod";
import { Types } from "mongoose";

export const SendMessageSchema = z.object({
  receiverId: z.string().nonempty({ message: "Receiver ID is required" }),
  message: z.string().min(1, { message: "Message cannot be empty" }).max(1000),
  replyTo: z.string().optional() // Dùng khi là reply
});

export const MarkAsReadSchema = z.object({
  chatId: z.string().nonempty({ message: "Chat ID is required" })
});

export const GetMessagesSchema = z.object({
  sender: z
    .string()
    .min(1, { message: "User ID 1 is required" })
    .refine((val) => Types.ObjectId.isValid(val), { message: "Invalid User ID 1" }),
    receiver: z
    .string()
    .min(1, { message: "User ID 2 is required" })
    .refine((val) => Types.ObjectId.isValid(val), { message: "Invalid User ID 2" }),
});

export const DeleteMessageSchema = z.object({
  messageId: z.string().nonempty({ message: "Message ID is required" }),
  userId: z.string().nonempty({ message: "User ID is required" })
});

export const GetChatListSchema = z.object({
  userId: z.string().nonempty({ message: "User ID is required" }),
  page: z.number().optional(),
  limit: z.number().optional()
});

export const GetLastMessagesSchema = z.object({
  userId: z.string().nonempty({ message: "User ID is required" })
});

export type GetMessagesDto = z.infer<typeof GetMessagesSchema>;
export type DeleteMessageDto = z.infer<typeof DeleteMessageSchema>;
export type SendMessageDto = z.infer<typeof SendMessageSchema>;
export type MarkAsReadDto = z.infer<typeof MarkAsReadSchema>;
export type GetChatListDto = z.infer<typeof GetChatListSchema>;
export type GetLastMessagesDto = z.infer<typeof GetLastMessagesSchema>;
