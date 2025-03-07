import logger from '@/configs/logger.config';
import { ErrorCode } from '@/constants/error-code';
import { CreatePaymentDto, UpdatePaymentDto, VerifyPaymentDto } from '@/dto/payment.dto';
import {
    BadRequestException,
    InternalServerErrorException,
} from '@/exceptions/http-exception';
import { PaymentModel } from '@/models/payment.model';
import User from '@/models/user.model';
import PayOS from '@payos/node';
import { injectable } from 'inversify';

@injectable()
export class PaymentService {
    private payOS: PayOS;

    constructor() {
        this.payOS = new PayOS(
            process.env.PAYOS_CLIENT_ID!,
            process.env.PAYOS_API_KEY!,
            process.env.PAYOS_CHECKSUM_KEY!
        );
    }

    async createPayment(data: CreatePaymentDto) {
        try {
            const paymentLink = await this.payOS.createPaymentLink({
                orderCode: Date.now(),
                amount: data.amount,
                description: data.description || 'Payment',
                cancelUrl: `${process.env.CLIENT_URL}/payment/cancel`,
                returnUrl: `${process.env.CLIENT_URL}/payment/success`,
            });

            // Save payment record to database
            await PaymentModel.create({
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

    async verifyPayment(data: VerifyPaymentDto) {
        try {
            const payment = await PaymentModel.findById(data.paymentId);
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
                        await User.findByIdAndUpdate(payment.userId, {
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
        return await PaymentModel.find({ userId }).sort({ createdAt: -1 });
    }

    async handleWebhook(data: UpdatePaymentDto) {
        const payment = await PaymentModel.findByIdAndUpdate(
            data.paymentId,
            { status: data.status },
            { new: true }
        );
        return payment;
    }
} 