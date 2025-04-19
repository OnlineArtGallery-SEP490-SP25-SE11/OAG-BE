import { z } from "zod";

const isObjectId = (val: string) => /^[a-f\d]{24}$/i.test(val);

export const CreateCommentSchema = z.object({
  targetId: z
    .string()
    .nonempty({ message: "Target ID is required" })
    .refine(isObjectId, { message: "Invalid target ID" }), // Kiểm tra targetId là ObjectId hợp lệ

  targetType: z.enum(["blog", "artwork"], {
    required_error: "Target type is required",
    invalid_type_error: "Target type must be either 'blog' or 'artwork'",
  }),

  onModel: z.enum(["blog", "artwork"], {
    required_error: "onModel is required",  // Thêm vào để yêu cầu 'onModel'
    invalid_type_error: "onModel must be either 'blog' or 'artwork'",
  }),

  content: z
    .string()
    .min(1, { message: "Content cannot be empty" })
    .max(1000, { message: "Content is too long" }),

  parentId: z
    .string()
    .nullable()
    .optional()
    .refine((val) => val === null || val === undefined || isObjectId(val), {
      message: "Invalid parent comment ID",
    }),
});

export const UpdateCommentSchema = z.object({
  content: z
    .string()
    .min(1, { message: "Content cannot be empty" })
    .max(1000, { message: "Content is too long" }),

  replies: z
    .array(z.string().refine(isObjectId, { message: "Invalid reply ID" }))
    .optional(),
});

export type CreateCommentDto = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentDto = z.infer<typeof UpdateCommentSchema>;
