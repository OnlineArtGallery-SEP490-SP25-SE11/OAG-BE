import { z } from 'zod';

export const CreatePaymentSchema = z.object({
    userId: z.string(),
    amount: z.number().min(1),
    description: z.string().optional(),
});

export type CreatePaymentDto = z.infer<typeof CreatePaymentSchema>;

export const UpdatePaymentSchema = z.object({
    paymentId: z.string(),
    status: z.enum(['PENDING', 'PAID', 'FAILED']),
});

export type UpdatePaymentDto = z.infer<typeof UpdatePaymentSchema>;

export const VerifyPaymentSchema = z.object({
    paymentId: z.string(),
});

export type VerifyPaymentDto = z.infer<typeof VerifyPaymentSchema>; 