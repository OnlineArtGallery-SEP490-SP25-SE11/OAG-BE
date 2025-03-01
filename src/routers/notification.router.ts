import { Router } from 'express';
import NotificationController from '@/controllers/notification.controller';
import roleRequire from '@/configs/middleware.config.ts';
const router = Router();

router.post('/', NotificationController.sendNotification);
// router.get("/", NotificationController.getNotifications);
router.get('/', roleRequire(), NotificationController.getNotificationByUserId);
export default router;
