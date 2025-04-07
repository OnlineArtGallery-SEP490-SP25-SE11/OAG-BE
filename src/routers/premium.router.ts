import container from '@/configs/container.config';
import roleRequire from '@/configs/middleware.config';
import { PremiumController } from '@/controllers/premium.controller';
import { Router } from 'express';

const router = Router();
const premiumController = container.get<PremiumController>(Symbol.for('PremiumController'));

// Đăng ký premium
router.post('/subscribe', roleRequire(), premiumController.subscribe);

// Hủy đăng ký premium
router.post('/unsubscribe', roleRequire(), premiumController.cancelSubscription);

// Kiểm tra trạng thái Premium
router.get('/status', roleRequire(), premiumController.checkStatus);

// Kiểm tra giới hạn người dùng
router.get('/limits/:type', roleRequire(), premiumController.checkLimits);

export default router; 