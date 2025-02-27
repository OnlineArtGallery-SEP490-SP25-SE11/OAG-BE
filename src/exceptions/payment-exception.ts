import { ErrorCode } from '@/constants/error-code';
import { HttpException } from './http-exception';

export class PaymentNotFoundException extends HttpException {
    constructor() {
        super('Payment not found', Number(ErrorCode.PAYMENT_NOT_FOUND));
    }
}