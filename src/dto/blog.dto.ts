import { z } from 'zod';

export const CreateBlogSchema = z.object({
	title: z.string().min(5).max(100).nonempty(),
	content: z.string().min(10).max(1000),
	image: z.string().url().nonempty(),
	userId: z.string()
});

export const CreateBlogPayload = z.object({
	title: z.string().min(5).max(100).nonempty(),
	content: z.string().min(10).max(1000),
	image: z.string().url().nonempty()
});

export const UpdateBlogSchema = z.object({
	_id: z.string(),
	title: z.string().min(5).max(100).optional(),
	content: z.string().min(10).max(1000).optional(),
	image: z.string().url().optional(),
	userId: z.string(),
	published: z.boolean().optional()
});
export type CreateBlogDto = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogDto = z.infer<typeof UpdateBlogSchema>;
