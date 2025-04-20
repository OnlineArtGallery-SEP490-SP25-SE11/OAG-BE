import { BadRequestException } from '@/exceptions/http-exception';
import BankRequest from '@/models/bank-request.model';
import Transaction from '@/models/transaction.model';
import Wallet from '@/models/wallet.model';
import { injectable } from 'inversify';

@injectable()
class BankRequestService {
    async createWithdrawalRequest(userId: string, amount: number, bankName: string, bankAccountName: string, idBankAccount: string) {
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            throw new BadRequestException('Wallet not found');
        }
        
        // Only check if balance is sufficient but don't deduct yet
        if (wallet.balance < amount) {
            throw new BadRequestException('Insufficient balance');
        }

        // Create transaction record with PENDING status
        const transaction = await Transaction.create({
            walletId: wallet._id,
            amount,
            type: 'WITHDRAWAL',
            status: 'PENDING'
        });

        // Create bank request record with PENDING status
        return BankRequest.create({
            walletId: wallet._id,
            amount,
            bankName,
            bankAccountName,
            idBankAccount,
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

    async approveWithdrawalRequest(bankRequestId: string) {
        const bankRequest = await BankRequest.findById(bankRequestId);
        
        if (!bankRequest) {
            throw new BadRequestException('Bank request not found');
        }
        
        
        // Get the wallet to deduct the balance now
        const wallet = await Wallet.findById(bankRequest.walletId);
        if (!wallet) {
            throw new BadRequestException('Wallet not found');
        }
        
        // Check if there is enough balance at approval time
        if (wallet.balance < bankRequest.amount) {
            throw new BadRequestException('Insufficient balance');
        }
        
        // Deduct the amount from wallet at approval time
        wallet.balance -= bankRequest.amount;
        
        // Update totalWithdrawInDay when withdrawal request is approved
        wallet.totalWithdrawInDay = (wallet.totalWithdrawInDay || 0) + bankRequest.amount;
        
        await wallet.save();
        
        // Update the entire bank request with new status - PUT operation
        const updatedBankRequest = await BankRequest.findByIdAndUpdate(
            bankRequestId,
            { 
                status: 'APPROVED',
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );
        
        // Also update the related transaction
        await Transaction.findOneAndUpdate(
            {
                walletId: bankRequest.walletId,
                type: 'WITHDRAWAL',
                status: 'PENDING'
            },
            {
                status: 'PAID',
                updatedAt: new Date()
            },
            { new: true }
        );
        
        return updatedBankRequest;
    }

    async getAllWithdrawalRequests() {
        try {
            const bankRequests = await BankRequest.find({})
                .sort({ createdAt: -1 })
                .populate('walletId', 'userId balance');
            
            return bankRequests;
        }
        catch (error: any) {
            throw new BadRequestException('Failed to fetch withdrawal requests: ' + error.message);
        }
    }

    async rejectWithdrawalRequest(bankRequestId: string) {
        const bankRequest = await BankRequest.findById(bankRequestId);
        
        if (!bankRequest) {
            throw new BadRequestException('Bank request not found');
        }
        
        // Update the entire bank request with new status - PUT operation
        const updatedBankRequest = await BankRequest.findByIdAndUpdate(
            bankRequestId,
            { 
                status: 'REJECTED',
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );
        
        // Also update the related transaction
        await Transaction.findOneAndUpdate(
            {
                walletId: bankRequest.walletId,
                type: 'WITHDRAWAL',
                status: 'PENDING'
            },
            {
                status: 'REJECTED',
                updatedAt: new Date()
            },
            { new: true }
        );
        
        return updatedBankRequest;
    }
}

export default BankRequestService;