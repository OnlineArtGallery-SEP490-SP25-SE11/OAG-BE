import { z } from 'zod';

export const CreateWithdrawalRequestSchema = z.object({
    amount: z.number().min(1, { message: 'Amount must be at least 1' }),
    bankName: z.string().nonempty({ message: 'Bank name is required' }),
    idAccount: z.string().nonempty({ message: 'Account ID is required' })
});

export const GetBankRequestsSchema = z.object({
    walletId: z.string().nonempty({ message: 'Wallet ID is required' })
});