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
});

export const RejectBlogSchema = z.object({
  blogId: z.string(),
  reason: z.string().optional()
});



export type RejectBlogDto = z.infer<typeof RejectBlogSchema>;
export type CreateBlogDto = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogDto = z.infer<typeof UpdateBlogSchema>;
