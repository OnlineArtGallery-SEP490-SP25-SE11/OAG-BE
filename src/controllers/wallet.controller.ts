import { BadRequestException } from '@/exceptions/http-exception';
import { BaseHttpResponse } from '@/lib/base-http-response';
import WalletService from '@/services/wallet.service';
import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';

@injectable()
class WalletController {
    constructor(
        @inject(Symbol.for('WalletService')) private walletService: WalletService
    ) {
        this.deposit = this.deposit.bind(this);
        this.withdraw = this.withdraw.bind(this);
        this.getTransactionHistory = this.getTransactionHistory.bind(this);
        this.getWallet = this.getWallet.bind(this);
        this.getAllTransaction = this.getAllTransaction.bind(this);
    }

    async deposit(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new BadRequestException('User not authenticated');
            }

            // const { paymentId } = req.body;
            // const wallet = await this.walletService.deposit(userId, paymentId);
            const payment = await this.walletService.deposit(
                userId,
                req.body.amount,
                req.body.description
            )
            const response = BaseHttpResponse.success(
                payment,
                201,
                'Deposit success'
            )
            return res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async withdraw(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new BadRequestException('User not authenticated');
            }

            const { amount } = req.body;
            const wallet = await this.walletService.withdraw(userId, amount);
            res.status(200).json(wallet);
        } catch (error) {
            next(error);
        }
    }

    async getTransactionHistory(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new BadRequestException('User not authenticated');
            }

            const skip = req.query.skip ? parseInt(req.query.skip as string) : undefined;
            const take = req.query.take ? parseInt(req.query.take as string) : undefined;
            const history = await this.walletService.getTransactionHistory(userId, skip, take);
            const response = BaseHttpResponse.success(
                history,
                200,
                'Get transaction history success'
            )
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }
    async getWallet(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new BadRequestException('User not authenticated');
            }

            const wallet = await this.walletService.get(userId);
            const response = BaseHttpResponse.success(
                wallet,
                200,
                'Get wallet success'
            )
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }
    async getAllTransaction(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const transactions = await this.walletService.getAllTransaction();
            const response = BaseHttpResponse.success(
                transactions,
                200,
                'Get all transactions success'
            );
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

}

export default WalletController;