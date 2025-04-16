import container from '@/configs/container.config';
import roleRequire from '@/configs/middleware.config';
import WalletController from '@/controllers/wallet.controller';
import { validate } from '@/middlewares/validate.middleware';
import { depositSchema, TransactionHistoryQuerySchema, WithdrawSchema } from '@/schemas/wallet.schema';
import { Router } from 'express';

const router = Router();
const walletController = container.get<WalletController>(Symbol.for('WalletController'));
router.post('/deposit', roleRequire(), validate(depositSchema), walletController.deposit);
router.post('/withdraw', roleRequire(), validate(WithdrawSchema), walletController.withdraw);
router.get('/transactions', roleRequire(), validate(TransactionHistoryQuerySchema, 'query'), walletController.getTransactionHistory);
router.get('/', roleRequire(), walletController.getWallet);
export default router;