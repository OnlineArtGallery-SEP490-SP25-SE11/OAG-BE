import { z } from 'zod';

export const artworkSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, { message: 'Title is required' })
		.max(255, { message: 'Title cannot exceed 255 characters' }),

	description: z
		.string()
		.trim()
		.min(100, { message: 'Description must be at least 100 characters' })
		.max(5000, { message: 'Description cannot exceed 5000 characters' }),

	category: z
		.array(
			z.string().trim().min(1, { message: 'Each category must be non-empty' })
		)
		.min(1, { message: 'At least one category is required' })
		.max(5, { message: 'You can select up to 5 categories only' }),

	dimensions: z.object({
		width: z
			.number({ invalid_type_error: 'Width must be a number' })
			.min(1, { message: 'Width must be at least 1 unit' })
			.max(10000, { message: 'Width cannot exceed 10,000 units' }),
		height: z
			.number({ invalid_type_error: 'Height must be a number' })
			.min(1, { message: 'Height must be at least 1 unit' })
			.max(10000, { message: 'Height cannot exceed 10,000 units' })
	}),

	url: z
		.string()
		.trim()
		.url({ message: 'Invalid URL format' })
		.max(2048, { message: 'URL cannot exceed 2048 characters' }),

	status: z.enum(['available', 'sold', 'hidden', 'selling'], {
		errorMap: () => ({ message: 'Invalid status value' })
	}),

	price: z
		.number({ invalid_type_error: 'Price must be a number' })
		.min(0, { message: 'Price must be at least 0' })
		.max(1_000_000, { message: 'Price cannot exceed 1,000,000' })
})
	.superRefine((data, ctx) => {
		// Kiểm tra điều kiện: nếu status là "selling" thì price phải lớn hơn 0.
		if (data.status === 'selling' && data.price <= 0) {
			ctx.addIssue({
				path: ['price'],
				message: 'Price must be greater than 0 when status is "selling"',
				code: z.ZodIssueCode.custom
			});
		}
		// Kiểm tra bổ sung: không được có danh mục trùng lặp
		const uniqueCategories = new Set(data.category.map((cat) => cat.toLowerCase()));
		if (uniqueCategories.size < data.category.length) {
			ctx.addIssue({
				path: ['category'],
				message: 'Duplicate categories are not allowed',
				code: z.ZodIssueCode.custom
			});
		}
	});
