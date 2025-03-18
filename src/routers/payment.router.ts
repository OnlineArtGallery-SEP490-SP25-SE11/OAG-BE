import { PaymentController } from '@/controllers/payment.controller';
import { Router } from 'express';
// import { authMiddleware } from '@/middlewares/auth.middleware';
import { container } from '@/configs/inversify.config';
import roleRequire from '@/configs/middleware.config';
import { Role } from '@/constants/enum';
import { validate } from '@/middlewares/validate.middleware';
import { VerifyPaymentParamsSchema, VerifyPaymentQuerySchema } from '@/schemas/payment.schema';
import { TYPES } from '@/types/payment.types';

const router = Router();
const paymentController = container.get<PaymentController>(TYPES.PaymentController);

router.post('/create', roleRequire(), paymentController.create);
router.get('/verify/:paymentId', validate(VerifyPaymentParamsSchema, "params"),
    validate(VerifyPaymentQuerySchema, "query")
    , roleRequire(), paymentController.verify);
router.get('/', roleRequire(), paymentController.get);
router.post(
    '/create-payment',
    roleRequire([Role.USER]),
    async (req, res, next) => {
        try {
            await paymentController.createPayment(req, res);
            next();
        } catch (error) {
            next(error);
        }
    }
);

// router.get(
//     '/verify/:paymentId',
//     roleRequire([Role.USER]),
//     async (req, res) => {
//         try {
//             await paymentController.verifyPayment(req, res);
//         } catch (error) {
//             logger.error('Payment verification route error:', error);
//             res.status(500).json({
//                 success: false,
//                 message: 'Payment verification failed'
//             });
//         }
//     }
// );

router.get(
    '/history',
    roleRequire(),
    paymentController.getPaymentHistory.bind(paymentController)
);

router.post('/webhook', paymentController.handleWebhook.bind(paymentController));

export default router; 