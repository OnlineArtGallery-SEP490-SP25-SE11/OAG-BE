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
	INVALID_QUERY_PARAMETERS = 'invalid_query_parameters',


	//Database
	DATABASE_ERROR = 'database_error',
	NOT_FOUND = 'not_found',
	INVALID_OPERATION = 'invalid_operation',
	//Validation
	VALIDATION_ERROR = 'validation_error',

	//Event
	INVALID_EVENT_ID = 'invalid_event_id',

	//Report
	INVALID_REPORT_ID = 'invalid_report_id',
	ACTION_REPORT_FAILED = 'action_report_failed',
	INVALID_REPORTER_ID = 'invalid_reporter_id',

	NOTFOUND = 'notfound',

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
	TRANSACTION_FAILED = 'transaction_failed',
	INSUFFICIENT_BALANCE = 'insufficient_balance',
	WALLET_NOT_FOUND = 'wallet_not_found',

	// exhibition
	LINKNAME_EXISTS = 'linkname_exists',
	TICKET_ALREADY_PURCHASED = 'ticket_already_purchased',
	TICKET_NOT_CONFIGURED = 'ticket_not_configured',

	//gallery
	GALLERY_NAME_EXISTS = 'gallery_name_exists',

	//baned
	USER_BANNED = 'user_banned',

	CCCD_USED = 'cccd_used',

}
