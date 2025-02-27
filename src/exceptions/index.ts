import { ErrorCode } from '@/constants/error-code';
import { HttpException } from './http-exception';

export class CouldNotFindBlogException extends HttpException {
	constructor() {
		super('Could not find blog', 404, ErrorCode.BLOG_NOT_FOUND);
	}
}

export class ValidationException extends HttpException {
	constructor(message: string, details: any) {
		super(message, 400, ErrorCode.VALIDATION_ERROR, details);
	}
}
