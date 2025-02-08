import { z } from 'zod';

export const CreateBlogSchema = z.object({
  title: z.string().min(5).max(100).nonempty(),
  content: z.string().optional(),
  image: z.string().url().nonempty(),
  author: z.string(),
});

export const CreateBlogPayload = z.object({
  title: z.string().min(5).max(100).nonempty(),
  content: z.string().optional(),
  image: z.string().url().nonempty(),
});

export const UpdateBlogSchema = z.object({
  _id: z.string(),
  title: z.string().min(5).max(100).optional(),
  content: z.string().optional(),
  image: z.string().url().optional(),
  author: z.string(),
  published: z.boolean().optional(),
});
export type CreateBlogDto = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogDto = z.infer<typeof UpdateBlogSchema>;
