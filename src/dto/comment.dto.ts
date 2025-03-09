import { z } from "zod";

export const CreateCommentSchema = z.object({
  blogId: z.string().nonempty({ message: "Blog ID is required" }),
  content: z.string().min(1, { message: "Content cannot be empty" }).max(1000)
});

export const UpdateCommentSchema = z.object({
  content: z.string().min(1, { message: "Content cannot be empty" }).max(1000)
});

export type CreateCommentDto = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentDto = z.infer<typeof UpdateCommentSchema>;
