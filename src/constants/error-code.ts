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

	//Validation
	VALIDATION_ERROR = 'validation_error',
	SERVER_ERROR = 'server_error'
}
