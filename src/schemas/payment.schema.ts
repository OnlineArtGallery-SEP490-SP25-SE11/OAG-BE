import { z } from "zod";

export const VerifyPaymentParamsSchema = z.object({
    paymentId: z.string().min(1, { message: "Payment ID is required" })
});

// Schema for payment verification query parameters
export const VerifyPaymentQuerySchema = z.object({
    orderCode: z.string().min(1, { message: "Order code is required" }),
    status: z.enum(['PENDING', 'PAID', 'FAILED', 'CANCELLED'], {
        errorMap: () => ({ message: "Status must be one of: PENDING, PAID, FAILED, CANCELLED" })
    }).optional()
});
