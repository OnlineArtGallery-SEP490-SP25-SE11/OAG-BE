import { ErrorCode } from '@/constants/error-code';

export class BaseHttpResponse {
	constructor(
		public readonly data: any = null,
		public readonly message: string | null = null,
		public readonly statusCode: number,
		public readonly errorCode: ErrorCode | null = null,
		public readonly details: any = null
	) {}

	static success(
		data: any,
		statusCode: number = 200,
		message: string | null = null
	) {
		return new BaseHttpResponse(data, message, statusCode, null, null);
	}

	static error(
		message: string,
		statusCode: number,
		errorCode: ErrorCode | null = null,
		detail: any = null
	) {
		return new BaseHttpResponse(
			null,
			message,
			statusCode,
			errorCode,
			detail
		);
	}
}
