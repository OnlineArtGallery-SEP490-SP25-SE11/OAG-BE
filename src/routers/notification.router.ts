import { Router } from 'express';
import NotificationController from '@/controllers/notification.controller';
import roleRequire from '@/configs/middleware.config.ts';
import { Role } from '@/constants/enum';
const router = Router();

//user routes
router.get('/', roleRequire(), NotificationController.getNotificationByUserId);
router.get('/unread', roleRequire(), NotificationController.getUnreadCount);
router.put('/read/:notificationId', roleRequire(), NotificationController.markAsRead);
router.delete('/delete/:notificationId', roleRequire(), NotificationController.deleteNotification);


//admin route
router.get('/admin',roleRequire([Role.ADMIN]), NotificationController.getAdminNotifications);
router.post('/admin',roleRequire([Role.ADMIN]), NotificationController.sendNotificationByRole);

router.post('/', NotificationController.sendNotification);
// router.get("/", NotificationController.getNotifications);
export default router;
