import { Response } from 'express';

interface SuccessResponse {
    message?: string;
    data?: any;
}



export const handleSuccess = (res: Response, { message, data }: SuccessResponse) => {
    return res.status(200).json({
        success: true,
        message,
        data
    });
};

export const handleError = (res: Response, error: any) => {
    // Xác định HTTP status code dựa trên loại lỗi
    let statusCode = 500;
    if (error.message.includes('not found')) {
        statusCode = 404;
    } else if (error.message.includes('Invalid') || error.message.includes('required')) {
        statusCode = 400;
    } else if (error.message.includes('Unauthorized')) {
        statusCode = 401;
    } else if (error.message.includes('Forbidden')) {
        statusCode = 403;
    }

    return res.status(statusCode).json({
        success: false,
        error: {
            message: error.message,
            code: statusCode
        }
    });
}; 