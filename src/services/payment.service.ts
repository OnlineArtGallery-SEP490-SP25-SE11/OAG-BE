import logger from '@/configs/logger.config';
import { ErrorCode } from '@/constants/error-code';
import { CreatePaymentDto, UpdatePaymentDto, VerifyPaymentDto } from '@/dto/payment.dto';
import {
    BadRequestException,
    InternalServerErrorException,
} from '@/exceptions/http-exception';
import Payment from '@/models/payment.model';
import User from '@/models/user.model';
import env from '@/utils/validateEnv.util';
import PayOS from '@payos/node';
import { injectable } from 'inversify';

interface PaymentPurchase {
    amount: number;
    description?: string;
}
interface PaymentVerification {
    orderCode: string;
    status: string;
    paymentId: string;
}
@injectable()
export class PaymentService {
    private payOS: PayOS;
    constructor() {
        this.payOS = new PayOS(
            env.PAYOS_CLIENT_ID,
            env.PAYOS_API_KEY,
            env.PAYOS_CHECKSUM_KEY
        );
    }
    // code=00&id=9b7c126d692a4f1fa4a37a412d7ba3fa&cancel=false&status=PAID&orderCode=280503
    async createPayment(data: CreatePaymentDto) {
        try {
            const paymentLink = await this.payOS.createPaymentLink({
                orderCode: Number(String(Date.now()).slice(-6)),
                amount: data.amount,
                description: data.description || 'Payment',
                cancelUrl: `${process.env.CLIENT_URL}/payment/cancel`,
                returnUrl: `${process.env.CLIENT_URL}/payment/success`,
            });

            // Save payment record to database
            await Payment.create({
                userId: data.userId,
                amount: data.amount,
                description: data.description,
                status: 'PENDING',
                paymentUrl: paymentLink.checkoutUrl,
                orderCode: paymentLink.orderCode
            });

            return { paymentUrl: paymentLink.checkoutUrl };
        } catch (error) {
            console.error('Error creating payment:', error);
            throw error;
        }
    }

    async payment(data: PaymentPurchase, userId: string): Promise<InstanceType<typeof Payment>> {
        try {
            const paymentUrl = await this.payOS.createPaymentLink({
                // orderCode: Number(String(Date.now()).slice(-6)),
                orderCode: Date.now(),
                amount: data.amount,
                description: data.description || `Payment for ${data.amount}`,
                cancelUrl: `${env.CLIENT_URL}/payment/cancel`,
                returnUrl: `${env.CLIENT_URL}/payment/success`,
            })
            const payment = await Payment.create({
                userId: userId,
                amount: data.amount,
                description: data.description,
                status: 'PENDING',
                paymentUrl: paymentUrl.checkoutUrl,
                orderCode: paymentUrl.orderCode
            })
            return payment
        } catch (error) {
            logger.error('Error when payment:', error);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to payment',
                ErrorCode.PAYMENT_VERIFICATION_FAILED
            );
        }
    }
    async verify(data: PaymentVerification, userId: string, callback?: Function): Promise<InstanceType<typeof Payment> | null> {
        try {
            const payment = await Payment.findOne({
                userId: userId,
                orderCode: data.orderCode
            });
            if (!payment) {
                throw new BadRequestException(
                    'Payment not found',
                    ErrorCode.PAYMENT_NOT_FOUND
                );
            }
            const paymentPayOS = await this.payOS.getPaymentLinkInformation(
                data.orderCode.toString()
            );
            if (paymentPayOS && payment.status !== paymentPayOS.status) {
                // Update payment with the new status
                const updatedPayment = await Payment.findOneAndUpdate(
                    { _id: payment._id },  // Find by ID to ensure we update the correct document
                    { status: paymentPayOS.status },
                    { new: true }  // Return the updated document
                );

                // Only call the callback if it exists and we have an updated payment
                if (callback && updatedPayment) {
                    callback(updatedPayment);
                }
                // Return the updated payment instead of the original
                return updatedPayment;
            }
            return payment;
        } catch (
        error
        ) {
            logger.error('Error verifying payment:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to verify payment',
                ErrorCode.PAYMENT_VERIFICATION_FAILED
            );
        }
    }

    async get(userId: string, skip: number, take: number) {
        try {
            let paymentQuery = Payment.find({ userId }).sort({ createdAt: -1 });
            console.log('Payment query:', skip, take);
            if (typeof skip === 'number' && skip >= 0) {
                paymentQuery = paymentQuery.skip(skip);
            }
            if (typeof take === 'number' && take > 0) {
                paymentQuery = paymentQuery.limit(take);
            }
            const [payment, total] = await Promise.all([
                paymentQuery.exec(),
                Payment.countDocuments({ userId }).exec()
            ]);
            return { payment, total };
        } catch (error) {
            logger.error('Error getting payments:', error);
            throw new InternalServerErrorException(
                'Failed to get payments',
                ErrorCode.PAYMENT_VERIFICATION_FAILED
            );
        }

    }

    async verifyPayment(data: VerifyPaymentDto) {
        try {
            const payment = await Payment.findById(data.paymentId);
            if (!payment) {
                throw new BadRequestException(
                    'Payment not found',
                    ErrorCode.PAYMENT_NOT_FOUND
                );
            }

            try {
                const paymentStatus = await this.payOS.getPaymentLinkInformation(
                    payment.orderCode.toString()
                );

                if (paymentStatus && payment.status !== paymentStatus.status) {
                    payment.status = paymentStatus.status as 'PENDING' | 'PAID' | 'FAILED';
                    await payment.save();

                    // Update user to premium if payment is successful
                    if (payment.status === 'PENDING') {
                        await User.findOneAndUpdate(
                            { _id: payment.userId },
                            {
                                isPremium: true,
                                premiumSince: new Date(),
                                avatarStyle: {
                                    hasCrown: true,
                                    hasSparklingBorder: true
                                }
                            });
                    }
                }

                return payment;
            } catch (payosError) {
                logger.error('PayOS verification error:', payosError);
                return payment;
            }
        } catch (error) {
            logger.error('Error verifying payment:', error);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to verify payment',
                ErrorCode.PAYMENT_VERIFICATION_FAILED
            );
        }
    }

    async getPaymentsByUserId(userId: string) {
        return await Payment.find({ userId }).sort({ createdAt: -1 });
    }

    async handleWebhook(data: UpdatePaymentDto) {
        const payment = await Payment.findByIdAndUpdate(
            data.paymentId,
            { status: data.status },
            { new: true }
        );
        return payment;
    }
} 