import { ErrorCode } from '@/constants/error-code';

export class HttpException extends Error {
	constructor(
		public readonly message: string,
		public readonly statusCode: number,
		public readonly errorCode?: ErrorCode,
		public readonly details?: any
	) {
		super(message);
	}
}

export class BadRequestException extends HttpException {
	constructor(message: string, errorCode?: ErrorCode, details?: any) {
		super(message, 400, errorCode, details);
	}
}

export class UnauthorizedException extends HttpException {
	constructor(message: string = 'Unauthorized') {
		super(message, 401, ErrorCode.UNAUTHORIZED);
	}
}

export class ForbiddenException extends HttpException {
	constructor(message: string = 'Forbidden') {
		super(message, 403, ErrorCode.FORBIDDEN);
	}
}

export class NotFoundException extends HttpException {
	constructor(message: string = 'NotFound') {
		super(message, 403, ErrorCode.NOTFOUND);
	}
}

export class InternalServerErrorException extends HttpException {
	constructor(
		message: string = 'Internal Server Error',
		errorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
		details?: any
	) {
		super(message, 500, errorCode, details);
	}
}

export class NotFoundException extends HttpException {
	constructor(message: string, errorCode?: ErrorCode, details?: any) {
		super(message, 404, errorCode, details);
	}
}
