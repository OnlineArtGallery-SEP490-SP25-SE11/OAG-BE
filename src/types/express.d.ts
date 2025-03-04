import 'express';

declare module 'express' {
	interface Request {
		userId?: string;
		userRole?: string[];
		validatedData?: any;
	}
}
