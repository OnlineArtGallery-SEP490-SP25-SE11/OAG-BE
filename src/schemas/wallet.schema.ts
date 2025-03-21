import { z } from 'zod';

export const depositSchema = z.object({
    amount: z.number()
        .positive({ message: 'Amount must be a positive number' })
        .min(5000, { message: 'Amount must be at least 5000' }),
    description: z.string().optional(),
})
export const WithdrawSchema = z.object({
    amount: z.number().min(1, { message: 'Amount must be at least 1' }),
});
export const TransactionHistoryQuerySchema = z.object({
    skip: z.string().optional().refine((val) => !val || !isNaN(parseInt(val)), {
        message: 'Skip must be a number'
    }),
    take: z.string().optional().refine((val) => !val || !isNaN(parseInt(val)), {
        message: 'Take must be a number'
    })
});