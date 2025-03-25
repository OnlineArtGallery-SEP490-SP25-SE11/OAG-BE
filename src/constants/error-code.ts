export enum ErrorCode {
	//Blog
	BLOG_NOT_FOUND = 'blog_not_found',
	INVALID_BLOG_ID = 'invalid_blog_id',
	INVALID_BLOG_DATA = 'invalid_blog_data',
	INVALID_BLOG_STATUS = 'invalid_blog_status',

	//HTTP
	UNAUTHORIZED = 'unauthorized',
	INTERNAL_SERVER_ERROR = 'internal_server_error',
	FORBIDDEN = 'forbidden',
	

	//Database
	DATABASE_ERROR = 'database_error',
	NOT_FOUND = 'not_found',
	//Validation
	VALIDATION_ERROR = 'validation_error',

	//Event
	INVALID_EVENT_ID = 'invalid_event_id',
	

	
	SERVER_ERROR = 'server_error',

	//Payment
	PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',
	PAYMENT_CREATION_FAILED = 'payment_creation_failed',
	PAYMENT_VERIFICATION_FAILED = 'PAYMENT_VERIFICATION_FAILED',
	INVALID_PAYMENT_AMOUNT = 'invalid_payment_amount',
	PAYMENT_ALREADY_PROCESSED = 'payment_already_processed',
	PAYMENT_SERVICE_ERROR = 'payment_service_error',
	INVALID_PAYMENT_ID = 'invalid_payment_id',
	PAYMENT_VERIFICATION_ERROR = 'payment_verification_error',
	PAYMENT_WEBHOOK_ERROR = 'payment_webhook_error',

	//
}
