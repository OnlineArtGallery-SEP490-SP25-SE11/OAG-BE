import { BadRequestException } from '@/exceptions/http-exception';
import BankRequestService from '@/services/bankrequest.service';
import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';

@injectable()
class BankRequestController {
    constructor(
        @inject(Symbol.for('BankRequestService')) private bankRequestService: BankRequestService
    ) {
        this.createWithdrawalRequest = this.createWithdrawalRequest.bind(this);
        this.getWithdrawalRequests = this.getWithdrawalRequests.bind(this);
        this.approveWithdrawalRequest = this.approveWithdrawalRequest.bind(this);
        this.getAllWithdrawalRequests = this.getAllWithdrawalRequests.bind(this);
        this.rejectWithdrawalRequest = this.rejectWithdrawalRequest.bind(this);
    }

    async createWithdrawalRequest(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new BadRequestException('User not authenticated');
            }

            const { amount, bankName,bankAccountName, idBankAccount } = req.body;
            const bankRequest = await this.bankRequestService.createWithdrawalRequest(userId, amount,bankName, bankAccountName, idBankAccount);
            res.status(201).json(bankRequest);
        } catch (error) {
            next(error);
        }
    }

    async getWithdrawalRequests(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new BadRequestException('User not authenticated');
            }

            const bankRequests = await this.bankRequestService.getWithdrawalRequests(userId);
            res.status(200).json(bankRequests);
        } catch (error) {
            next(error);
        }
    }

    async approveWithdrawalRequest(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const bankRequestId = req.params.id;
            if (!bankRequestId) {
                throw new BadRequestException('Bank request ID is required');
            }

            const bankRequest = await this.bankRequestService.approveWithdrawalRequest(bankRequestId);
            res.status(200).json(bankRequest);
        } catch (error) {
            next(error);
        }
    }

    async getAllWithdrawalRequests(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const bankRequests = await this.bankRequestService.getAllWithdrawalRequests();
            res.status(200).json(bankRequests);
        } catch (error) {
            next(error);
        }
    }

    async rejectWithdrawalRequest(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const bankRequestId = req.params.id;
            if (!bankRequestId) {
                throw new BadRequestException('Bank request ID is required');
            }

            const bankRequest = await this.bankRequestService.rejectWithdrawalRequest(bankRequestId);
            res.status(200).json(bankRequest);
        } catch (error) {
            next(error);
        }
    }
}

export default BankRequestController;