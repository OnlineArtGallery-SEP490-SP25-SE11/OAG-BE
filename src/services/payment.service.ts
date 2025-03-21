import logger from '@/configs/logger.config';
import { ErrorCode } from '@/constants/error-code';
import { CreatePaymentDto, UpdatePaymentDto } from '@/dto/payment.dto';
import {
    BadRequestException,
    InternalServerErrorException,
} from '@/exceptions/http-exception';
import Payment from '@/models/payment.model';
import Transaction from '@/models/transaction.model';
import Wallet from '@/models/wallet.model';
import env from '@/utils/validateEnv.util';
import PayOS from '@payos/node';
import { injectable } from 'inversify';
import mongoose from 'mongoose';
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
    constructor(
    ) {
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
            const _payment = await Payment.create({
                userId: userId,
                amount: data.amount,
                description: data.description,
                status: 'PENDING',
                paymentUrl: paymentUrl.checkoutUrl,
                orderCode: paymentUrl.orderCode
            })
            const payment = await _payment.save()
            return payment;
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
    async verify(data: PaymentVerification, userId: string): Promise<InstanceType<typeof Payment>> {
        // Verify with PayOS first
        let paymentPayOS;
        try {
            logger.debug('Verifying payment with PayOS:', { orderCode: data.orderCode });
            paymentPayOS = await this.payOS.getPaymentLinkInformation(
                data.orderCode.toString()
            );
    
            if (!paymentPayOS) {
                throw new BadRequestException(
                    'Payment verification failed - No data from PayOS',
                    ErrorCode.PAYMENT_VERIFICATION_FAILED
                );
            }
        } catch (error: any) {
            logger.error('Error getting payment info from PayOS:', { 
                orderCode: data.orderCode,
                error: error.message 
            });
            throw new BadRequestException(
                'Payment verification with payment gateway failed',
                ErrorCode.PAYMENT_VERIFICATION_FAILED
            );
        }
        
        try {
            // Find the payment record
            const payment = await Payment.findOne({
                userId,
                orderCode: data.orderCode
            });
    
            if (!payment) {
                throw new BadRequestException(
                    'Payment not found in database',
                    ErrorCode.PAYMENT_NOT_FOUND
                );
            }
            
            const paymentId = payment._id.toString();
            logger.debug('Found payment record:', { paymentId, status: payment.status });
            
            // First check if payment is already processed
            const existingTransaction = await Transaction.findOne({ paymentId });
            
            if (existingTransaction) {
                logger.info('Payment already processed, transaction exists:', { 
                    transactionId: existingTransaction._id.toString(),
                    paymentId
                });
                return payment;
            }
            
            // Update payment status if required
            let updatedPayment = payment;
            if (payment.status !== paymentPayOS.status) {
                logger.info('Payment status changed:', {
                    oldStatus: payment.status,
                    newStatus: paymentPayOS.status,
                    paymentId
                });
                
                const result = await Payment.findOneAndUpdate(
                    { _id: paymentId },
                    { status: paymentPayOS.status },
                    { new: true }
                );
            
                if (!result) {
                    throw new Error(`Failed to update payment status for payment: ${paymentId}`);
                }
                
                // Now we're sure result is not null
                updatedPayment = result;
            }
            
            // Process successful payments - only if status is PAID AND no transaction exists
            if (paymentPayOS.status === 'PAID') {
                logger.info('Processing successful payment:', { paymentId });
                await this.processPaymentSafely({
                    paymentId: updatedPayment._id.toString(),
                    orderCode: updatedPayment.orderCode,
                    amount: updatedPayment.amount
                }, userId);
            }
    
            return updatedPayment;
        } catch (error: any) {
            logger.error('Error in payment verification:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                orderCode: data.orderCode
            });
            
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(
                `Failed to verify payment: ${error.message}`,
                ErrorCode.PAYMENT_VERIFICATION_FAILED
            );
        }
    }
    private async processPaymentSafely(
        { paymentId, orderCode, amount }: { paymentId: string, orderCode: string, amount: number },
        userId: string
    ): Promise<void> {
        try {
            // 1. Generate a unique transactionId based on paymentId to ensure idempotency
            const transactionIdBase = `${paymentId}-${orderCode}`;
            const transactionIdHash = require('crypto').createHash('md5').update(transactionIdBase).digest('hex');
    
            // 2. Check if transaction already exists with this unique ID
            const existingTransaction = await Transaction.findOne({
                paymentId,
            });
    
            if (existingTransaction) {
                logger.info('Transaction already exists for this payment:', {
                    transactionId: existingTransaction._id.toString(),
                    paymentId
                });
                return;
            }
    
            // 3. Find or create wallet with retry logic
            let wallet = null;
            let retries = 3;
            
            while (retries > 0 && !wallet) {
                wallet = await Wallet.findOne({ userId });
                
                if (!wallet) {
                    try {
                        wallet = new Wallet({ userId, balance: 0 });
                        wallet = await wallet.save();
                        logger.info('Created new wallet for user:', { userId, walletId: wallet._id.toString() });
                    } catch (err: any) {
                        // If error is duplicate key, retry finding the wallet
                        if (err.code === 11000) {
                            logger.warn('Race condition creating wallet, retrying find:', { userId });
                            retries--;
                            continue;
                        }
                        throw err;
                    }
                }
                break;
            }
            
            if (!wallet) {
                throw new Error(`Failed to find or create wallet for userId: ${userId}`);
            }
            
            // 4. Create transaction first with status PENDING
            const transaction = new Transaction({
                walletId: wallet._id,
                amount,
                type: 'DEPOSIT',
                status: 'PENDING', // Start with PENDING
                orderCode,
                paymentId,
                idempotencyKey: transactionIdHash // Store idempotency key
            });
    
            const savedTransaction = await transaction.save();
            logger.info('Created pending transaction:', {
                transactionId: savedTransaction._id.toString(),
                paymentId
            });
    
            // 5. Update wallet balance with specific conditions to prevent race conditions
            const updatedWallet = await Wallet.findOneAndUpdate(
                { _id: wallet._id },
                { $inc: { balance: amount } },
                { new: true }
            );
    
            if (!updatedWallet) {
                // If wallet update fails, mark transaction as FAILED
                await Transaction.findByIdAndUpdate(savedTransaction._id, { status: 'FAILED' });
                throw new Error(`Failed to update wallet balance for walletId: ${wallet._id}`);
            }
    
            logger.info('Updated wallet balance:', {
                walletId: updatedWallet._id.toString(),
                amount,
                newBalance: updatedWallet.balance
            });
    
            // 6. Update transaction to PAID status
            await Transaction.findByIdAndUpdate(savedTransaction._id, { status: 'PAID' });
            logger.info('Updated transaction to PAID:', {
                transactionId: savedTransaction._id.toString(),
                paymentId
            });
    
        } catch (error: any) {
            logger.error('Error processing successful payment:', { 
                message: error.message,
                paymentId,
                userId
            });
            throw error;
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