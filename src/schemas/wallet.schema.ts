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
export const WalletStatisticsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  transactionType: z.enum(['DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'SALE']).optional(),
  status: z.enum(['PENDING', 'PAID', 'FAILED']).optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day')
});
export const WalletStatisticsQuerySchema = z.object({
    startDate: z.string()
        .transform((date) => {
            const parsed = new Date(decodeURIComponent(date));
            if (isNaN(parsed.getTime())) {
                throw new Error('Invalid date format');
            }
            return parsed;
        })
        .optional(),
    endDate: z.string()
        .transform((date) => {
            const parsed = new Date(decodeURIComponent(date));
            if (isNaN(parsed.getTime())) {
                throw new Error('Invalid date format');
            }
            return parsed;
        })
        .optional(),
    transactionType: z.enum(['DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'SALE']).optional(),
    status: z.enum(['PENDING', 'PAID', 'FAILED']).optional(),
    groupBy: z.enum(['day', 'week', 'month']).default('day')
}).strict();