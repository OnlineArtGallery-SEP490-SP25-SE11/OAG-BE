import container from '@/configs/container.config';
import roleRequire from '@/configs/middleware.config';
import { Role } from '@/constants/enum';
import BankRequestController from '@/controllers/bankrequest.controller';
import { validate } from '@/middlewares/validate.middleware';
import { CreateWithdrawalRequestSchema } from '@/schemas/bankrequest.schema';
import { Router } from 'express';

const router = Router();
const bankRequestController = container.get<BankRequestController>(Symbol.for('BankRequestController'));
router.get('/withdrawals', roleRequire(), bankRequestController.getWithdrawalRequests);
router.get('/withdrawals/all', roleRequire(Role.ADMIN), bankRequestController.getAllWithdrawalRequests);
router.post('/withdraw', roleRequire(), validate(CreateWithdrawalRequestSchema), bankRequestController.createWithdrawalRequest);
router.put('/withdraw/:id/approve', roleRequire(Role.ADMIN), bankRequestController.approveWithdrawalRequest);
router.put('/withdraw/:id/reject', roleRequire(Role.ADMIN), bankRequestController.rejectWithdrawalRequest);
export default router;