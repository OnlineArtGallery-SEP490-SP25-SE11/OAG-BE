import { z } from 'zod';

// Kiểm tra sdt khi gửi OTP
export const phoneSchema = z.object({
	phone: z
		.string()
		.regex(/^(0[35789])+([0-9]{8})$/, 'Invalid phone number format')
});

export const phoneSignupSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	phone: z
		.string()
		.regex(/^(0[35789])+([0-9]{8})$/, 'Invalid phone number format'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	otp: z.string().min(6, 'OTP must be 6 characters')
});

export const phoneSigninSchema = z.object({
	phone: z
		.string()
		.regex(/^(0[35789])+([0-9]{8})$/, 'Invalid phone number format'),
	password: z.string().min(1, 'Password is required')
});

// Create types from schemas
export type PhoneSignupInput = z.infer<typeof phoneSignupSchema>;
export type PhoneSigninInput = z.infer<typeof phoneSigninSchema>;
export type PhoneSchema = z.infer<typeof phoneSchema>;
