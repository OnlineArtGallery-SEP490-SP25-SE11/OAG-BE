import { BadRequestException } from '@/exceptions/http-exception';
import BankRequest from '@/models/bank-request.model';
import Transaction from '@/models/transaction.model';
import Wallet from '@/models/wallet.model';
import { injectable } from 'inversify';

@injectable()
class BankRequestService {
    async createWithdrawalRequest(userId: string, amount: number, bankName: string, idAccount: string) {
        const wallet = await Wallet.findOne({ userId });
        if (!wallet || wallet.balance < amount) {
            throw new BadRequestException('Insufficient balance');
        }

        wallet.balance -= amount;
        await wallet.save();

        // Create transaction record
        await Transaction.create({
            walletId: wallet._id,
            amount,
            type: 'WITHDRAWAL',
            status: 'PENDING'
        });

        // Create bank request record
        return BankRequest.create({
            walletId: wallet._id,
            amount,
            bankName,
            idAccount,
            status: 'PENDING'
        });
    }

    async getWithdrawalRequests(userId: string) {
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            throw new BadRequestException('Wallet not found');
        }

        return BankRequest.find({ walletId: wallet._id }).sort({ createdAt: -1 });
    }
}

export default BankRequestService;