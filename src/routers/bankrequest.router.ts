import container from '@/configs/container.config';
import roleRequire from '@/configs/middleware.config';
import BankRequestController from '@/controllers/bankrequest.controller';
import { validate } from '@/middlewares/validate.middleware';
import { CreateWithdrawalRequestSchema } from '@/schemas/bankrequest.schema';
import { Router } from 'express';

const router = Router();
const bankRequestController = container.get<BankRequestController>(Symbol.for('BankRequestController'));
router.post('/withdraw', roleRequire(), validate(CreateWithdrawalRequestSchema), bankRequestController.createWithdrawalRequest);
router.get('/withdrawals', roleRequire(), bankRequestController.getWithdrawalRequests);

export default router;