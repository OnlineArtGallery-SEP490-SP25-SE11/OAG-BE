import { Status } from '@/constants/enum';
import { z } from 'zod';

export const CreateBlogSchema = z.object({
  title: z.string().min(5).max(100).nonempty(),
  content: z.string().optional(),
  image: z.string().url().nonempty(),
  tags: z.array(z.string()).optional()
});

export const CreateBlogPayload = z.object({
  title: z.string().min(5).max(100).nonempty(),
  content: z.string().optional(),
  image: z.string().url().nonempty(),
  tags: z.array(z.string()).optional()
});

export const UpdateBlogSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  content: z.string().optional(),
  image: z.string().url().optional(),
  status: z.nativeEnum(Status).optional(),
  tags: z.array(z.string()).optional(),
  hearts: z.array(z.string()).optional(), // Thêm danh sách userId đã thả tim
});

export const RejectBlogSchema = z.object({
  reason: z.string().optional()
});

export const AddHeartSchema = z.object({
  blogId: z.string(),
  userId: z.string(),
});

export const RemoveHeartSchema = z.object({
  blogId: z.string(),
  userId: z.string(),
});

// ✅ Schema mới kiểm tra user đã thả tim hay chưa
export const IsHeartSchema = z.object({
  blogId: z.string(),
  userId: z.string(),
});

// ✅ Schema mới lấy danh sách người đã thả tim
export const GetHeartUsersSchema = z.object({
  blogId: z.string(),
});

export type AddHeartDto = z.infer<typeof AddHeartSchema>;
export type RemoveHeartDto = z.infer<typeof RemoveHeartSchema>;
export type RejectBlogDto = z.infer<typeof RejectBlogSchema>;
export type CreateBlogDto = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogDto = z.infer<typeof UpdateBlogSchema>;
export type IsHeartDto = z.infer<typeof IsHeartSchema>; 
export type GetHeartUsersDto = z.infer<typeof GetHeartUsersSchema>;
