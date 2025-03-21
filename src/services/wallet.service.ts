import logger from '@/configs/logger.config';
import { BadRequestException, InternalServerErrorException } from '@/exceptions/http-exception';
import Transaction from '@/models/transaction.model';
import Wallet from '@/models/wallet.model';
import { PaymentService } from '@/services/payment.service';
import { TYPES } from '@/types/payment.types';
import { inject, injectable } from 'inversify';


@injectable()
class WalletService {
    constructor(
        @inject(TYPES.PaymentService) private paymentService: PaymentService
    ) { }

    async deposit(userId: string, amount: number, description: string) {
        try {
            if (!userId) {
                throw new BadRequestException('User ID is required');
            }
            if (!amount || amount <= 0) {
                throw new BadRequestException('Amount must be a positive number');
            }
            let wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                wallet = await Wallet.create({
                    userId,
                    balance: 0
                });
                logger.info('Created new wallet for deposit:', { userId, walletId: wallet._id });
            }
            const payment = await this.paymentService.payment(
                { amount, description: description || `Deposit ${amount}` },
                userId
            );

            const transaction = await Transaction.create({
                walletId: wallet._id,
                userId,
                amount: payment.amount,
                type: 'DEPOSIT',
                status: payment.status,
                // description: description || `Deposit ${amount}`
                orderCode: payment.orderCode,
            });
            await transaction.save()
            return payment;
        } catch (error) {
            logger.error('Error processing deposit:', error);

            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Failed to process deposit',
            );
        }
    }

    async withdraw(userId: string, amount: number) {
        try {
            if (!userId) {
                throw new BadRequestException('User ID is required');
            }

            if (!amount || amount <= 0) {
                throw new BadRequestException('Amount must be a positive number');
            }

            const wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                throw new BadRequestException('Wallet not found');
            }

            if (wallet.balance < amount) {
                throw new BadRequestException(
                    `Insufficient balance. Available: ${wallet.balance}`
                );
            }

            // Update wallet balance
            const updatedWallet = await Wallet.findByIdAndUpdate(
                wallet._id,
                { $inc: { balance: -amount } },
                { new: true }
            );

            // Create transaction record
            const transaction = await Transaction.create({
                walletId: wallet._id,
                userId,
                amount,
                type: 'WITHDRAWAL',
                status: 'COMPLETED',
                description: `Withdrawal ${amount}`
            });

            logger.info('Withdrawal completed:', {
                userId,
                amount,
                newBalance: updatedWallet?.balance,
                transactionId: transaction._id
            });

            return updatedWallet;
        } catch (error) {
            logger.error('Error processing withdrawal:', error);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to process withdrawal'
            );
        }
    }

    async payment(userId: string, amount: number, description: string, callback?: Function) {
        try {
            if (!userId) {
                throw new BadRequestException('User ID is required');
            }
            if (!amount || amount <= 0) {
                throw new BadRequestException('Amount must be a positive number');
            }
            // Atomic operation: find wallet and update balance in one step if sufficient funds exist
            const wallet = await Wallet.findOneAndUpdate(
                { userId, balance: { $gte: amount } },
                { $inc: { balance: -amount } },
                { new: true }
            );
            // Handle insufficient balance case
            if (!wallet) {
                const originalWallet = await Wallet.findOne({ userId });
                if (!originalWallet) {
                    throw new BadRequestException('Wallet not found');
                }
                return {
                    status: 'FAILED',
                    message: `Insufficient balance. Available: ${originalWallet.balance}`
                };
            }
            const transaction = await Transaction.create({
                walletId: wallet._id,
                userId,
                amount,
                type: 'PAYMENT',
                status: 'COMPLETED',
                description: description || `Payment ${amount}`
            });

            if (callback) {
                callback();
            }

            logger.info('Payment completed successfully:', {
                userId,
                amount,
                newBalance: wallet.balance,
                transactionId: transaction._id
            });

            return {
                status: 'SUCCESS',
                message: 'Payment successful',
            };
        } catch (error) {
            logger.error('Error processing payment:', error);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to process payment'
            );
        }
    }

    async getTransactionHistory(userId: string, skip?: number, take?: number) {
        try {
            if (!userId) {
                throw new BadRequestException('User ID is required');
            }

            // Find or create wallet
            let wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                wallet = await Wallet.create({
                    userId,
                    balance: 0
                });
                logger.info('Created new wallet for transaction history:', { userId });
            }

            // Build query
            const query = Transaction.find({ walletId: wallet._id })
                .sort({ createdAt: -1 });

            if (typeof skip === 'number' && skip >= 0) {
                query.skip(skip);
            }

            if (typeof take === 'number' && take > 0) {
                query.limit(take);
            }

            // Execute query and count in parallel
            const [transactions, total] = await Promise.all([
                query.exec(),
                Transaction.countDocuments({ walletId: wallet._id })
            ]);

            logger.debug('Retrieved transaction history:', {
                userId,
                transactionCount: transactions.length,
                total
            });

            return { transactions, total };
        } catch (error) {
            logger.error('Error getting transaction history:', error);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to retrieve transaction history'
            );
        }
    }

    async get(userId: string) {
        try {
            if (!userId) {
                throw new BadRequestException('User ID is required');
            }

            let wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                wallet = await Wallet.create({
                    userId,
                    balance: 0
                });
                logger.info('Created new wallet:', { userId, walletId: wallet._id });
                return wallet;
            }

            return wallet;
        } catch (error) {
            logger.error('Error getting wallet:', error);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to retrieve wallet information'
            );
        }
    }


}

export default WalletService;