import logger from '@/configs/logger.config';
import { BadRequestException, InternalServerErrorException } from '@/exceptions/http-exception';
import Transaction from '@/models/transaction.model';
import Wallet from '@/models/wallet.model';
import { PaymentService } from '@/services/payment.service';
import { TYPES } from '@/types/payment.types';
import { inject, injectable } from 'inversify';

interface TimeSeriesItem {
    _id: string;
    inflow: number;
    outflow: number;
    netFlow: number;
    transactions: number;
}

interface WalletTrends {
    inflowTrend: number;
    outflowTrend: number;
    netFlowTrend: number;
}

interface WalletSummary {
    totalInflow: number;
    totalOutflow: number;
    totalTransactions: number;
    avgDailyVolume: number;
}

interface WalletStatisticsResponse {
    currentBalance: number;
    timeSeries: TimeSeriesItem[];
    trends: WalletTrends;
    summary: WalletSummary;
}

@injectable()
class WalletService {
    constructor(
        @inject(TYPES.PaymentService) private paymentService: PaymentService
    ) { }
    //nap tien
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
    // rut tien
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

            // Sử dụng phương thức subtractFunds mới
            const updatedWallet = await this.subtractFunds(wallet._id as string, amount, {
                type: 'WITHDRAWAL',
                description: `Withdrawal ${amount}`,
                userId
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
    // thanh toan
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

            // Tạo transaction
            const transaction = await Transaction.create({
                walletId: wallet._id,
                userId,
                amount,
                type: 'PAYMENT',
                status: 'PAID',
                description: description || `Payment ${amount}`,
                orderCode: Date.now()
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
            console.log('error', error)
            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to process payment'
            );
        }
    }
    //get transaction
    async getTransactionHistory(userId: string, skip?: number, take?: number) {
        try {
            if (!userId) {
                throw new BadRequestException('User ID is required');
            }
            // console.log('userId', userId)
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
            console.log(transactions);
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
    //get wallet
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

    /**
     * Thêm tiền vào ví và tạo giao dịch tương ứng
     * @param walletId ID của ví
     * @param amount Số tiền cần thêm
     * @param transactionDetails Chi tiết giao dịch
     * @returns Ví đã được cập nhật
     */
    async addFunds(walletId: string, amount: number, transactionDetails: {
        type: 'DEPOSIT'| 'WITHDRAWAL'| 'PAYMENT'| 'SALE',
        description: string,
        userId: string,
        status?: 'PENDING' | 'PAID' | 'FAILED',
        // orderCode?: string
    }) {
        try {
            if (!amount || amount <= 0) {
                throw new BadRequestException('Amount must be a positive number');
            }

            // Cập nhật ví với atomic operation
            const updatedWallet = await Wallet.findOneAndUpdate(
                { _id: walletId },
                { $inc: { balance: amount } },
                { new: true }
            );

            if (!updatedWallet) {
                throw new BadRequestException('Wallet not found');
            }

            // Tạo giao dịch
            const transaction = await Transaction.create({
                walletId,
                userId: transactionDetails.userId,
                amount,
                type: transactionDetails.type,
                status: transactionDetails.status || 'PAID',
                description: transactionDetails.description,
                // orderCode: transactionDetails.orderCode || Date.now().toString()
            });

            logger.info(`Added ${amount} to wallet:`, {
                walletId,
                amount,
                newBalance: updatedWallet.balance,
                transactionId: transaction._id
            });

            return updatedWallet;
        } catch (error) {
            logger.error('Error adding funds to wallet:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to add funds to wallet');
        }
    }

    /**
     * Trừ tiền từ ví và tạo giao dịch tương ứng
     * @param walletId ID của ví
     * @param amount Số tiền cần trừ
     * @param transactionDetails Chi tiết giao dịch
     * @returns Ví đã được cập nhật
     */
    async subtractFunds(walletId: string, amount: number, transactionDetails: {
        type: 'DEPOSIT'| 'WITHDRAWAL'| 'PAYMENT'| 'SALE',
        description: string,
        userId: string,
        status?: 'PENDING' | 'PAID' | 'FAILED',
        orderCode?: string
    }) {
        try {
            if (!amount || amount <= 0) {
                throw new BadRequestException('Amount must be a positive number');
            }

            // Kiểm tra số dư trước khi trừ tiền
            const wallet = await Wallet.findById(walletId);
            if (!wallet) {
                throw new BadRequestException('Wallet not found');
            }

            if (wallet.balance < amount) {
                throw new BadRequestException(`Insufficient balance. Available: ${wallet.balance}`);
            }

            // Cập nhật ví với atomic operation
            const updatedWallet = await Wallet.findOneAndUpdate(
                { _id: walletId, balance: { $gte: amount } },
                { $inc: { balance: -amount } },
                { new: true }
            );

            if (!updatedWallet) {
                throw new BadRequestException('Failed to update wallet balance');
            }

            // Tạo giao dịch
            const transaction = await Transaction.create({
                walletId,
                userId: transactionDetails.userId,
                amount,
                type: transactionDetails.type,
                status: transactionDetails.status || 'PAID',
                description: transactionDetails.description,
                orderCode: transactionDetails.orderCode || Date.now().toString()
            });

            logger.info(`Subtracted ${amount} from wallet:`, {
                walletId,
                amount,
                newBalance: updatedWallet.balance,
                transactionId: transaction._id
            });

            return updatedWallet;
        } catch (error) {
            logger.error('Error subtracting funds from wallet:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to subtract funds from wallet');
        }
    }


    async getAllTransaction() {
        try {
            const transactions = await Transaction.find().sort({ createdAt: -1 });
    
            logger.info('Retrieved all transactions (admin):', {
                transactionCount: transactions.length,
            });
    
            return transactions;
        } catch (error) {
            logger.error('Error getting all transactions:', error);
    
            throw new InternalServerErrorException(
                'Failed to retrieve transactions'
            );
        }
    }

    async getWalletStatistics({
        userId,
        startDate,
        endDate,
        transactionType,
        status,
        groupBy = 'day'
    }: {
        userId: string;
        startDate?: Date;
        endDate?: Date;
        transactionType?: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'SALE';
        status?: 'PENDING' | 'PAID' | 'FAILED';
        groupBy?: 'day' | 'week' | 'month';
    }): Promise<WalletStatisticsResponse> {
        try {
            if (!userId) {
                throw new BadRequestException('User ID is required for statistics');
            }

            // Find wallet first
            const wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                throw new BadRequestException('Wallet not found');
            }

            // Build base query with walletId instead of userId
            const query: any = { 
                walletId: wallet._id 
            };
            
            // Set default date range if not provided (last 30 days)
            const defaultStartDate = new Date();
            defaultStartDate.setDate(defaultStartDate.getDate() - 30);
            
            query.createdAt = {
                $gte: startDate || defaultStartDate,
                $lte: endDate || new Date()
            };

            if (transactionType) query.type = transactionType;
            if (status) query.status = status;

            logger.info('Wallet statistics query:', query);

            // Aggregation pipeline
            const timeSeriesStats = await Transaction.aggregate([
                { 
                    $match: query 
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: groupBy === 'month' ? '%Y-%m' : 
                                       groupBy === 'week' ? '%Y-W%V' : '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        },
                        inflow: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$type', 'DEPOSIT'] },
                                    '$amount',
                                    0
                            ]
                        }
                        },
                        outflow: {
                            $sum: {
                                $cond: [
                                    { $in: ['$type', ['WITHDRAWAL', 'PAYMENT']] },
                                    '$amount',
                                    0
                            ]
                        }
                        },
                        transactions: { $sum: 1 }
                    }
                },
                { $sort: { '_id': 1 } }
            ]);

            logger.info('Aggregation results:', timeSeriesStats);

            // Calculate summary even if timeSeries is empty
            const summary = {
                totalInflow: timeSeriesStats.reduce((sum, stat) => sum + (stat.inflow || 0), 0),
                totalOutflow: timeSeriesStats.reduce((sum, stat) => sum + (stat.outflow || 0), 0),
                totalTransactions: timeSeriesStats.reduce((sum, stat) => sum + (stat.transactions || 0), 0),
                avgDailyVolume: timeSeriesStats.length > 0 
                    ? timeSeriesStats.reduce((sum, stat) => sum + (stat.inflow || 0) + (stat.outflow || 0), 0) / timeSeriesStats.length
                    : 0
            };

            return {
                currentBalance: wallet.balance,
                timeSeries: timeSeriesStats,
                trends: {
                    inflowTrend: timeSeriesStats.length > 1 ? calculateTrend(timeSeriesStats, 'inflow') : 0,
                    outflowTrend: timeSeriesStats.length > 1 ? calculateTrend(timeSeriesStats, 'outflow') : 0,
                    netFlowTrend: timeSeriesStats.length > 1 ? 
                        calculateTrend(timeSeriesStats, (stat) => (stat.inflow || 0) - (stat.outflow || 0)) : 0
                },
                summary
            };

        } catch (error) {
            logger.error('Error getting wallet statistics:', error);
            throw error instanceof BadRequestException ? error :
                new InternalServerErrorException('Failed to retrieve wallet statistics');
        }
    }
    
}

// Helper function to calculate trends
function calculateTrend(data: any[], field: string | ((item: any) => number)): number {
    if (data.length < 2) return 0;
    
    const getValue = typeof field === 'string' 
        ? (item: any) => item[field] || 0
        : field;

    const first = getValue(data[0]);
    const last = getValue(data[data.length - 1]);
    
    return first === 0 ? 100 : ((last - first) / first) * 100;
}

export default WalletService;