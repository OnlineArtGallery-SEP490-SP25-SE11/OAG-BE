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
    }

    async createWithdrawalRequest(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new BadRequestException('User not authenticated');
            }

            const { amount, bankName, idAccount } = req.body;
            const bankRequest = await this.bankRequestService.createWithdrawalRequest(userId, amount, bankName, idAccount);
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
}

export default BankRequestController;