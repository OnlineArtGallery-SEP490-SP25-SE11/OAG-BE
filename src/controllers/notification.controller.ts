import { NextFunction, Request, Response } from 'express';
import NotificationService from '@/services/notification.service';
import logger from '@/configs/logger.config.ts';
import {BaseHttpResponse} from '@/lib/base-http-response';
class NotificationController {
	public async sendNotification(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const { title, content, userId } = req.body;
			const notification = await NotificationService.createNotification({
				title,
				content,
				userId
			});
			res.status(201).json(notification);
		} catch (err: any) {
			next(err);
		}
	}
	public async getNotifications(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const notifications = await NotificationService.getNotifications();
			res.json(notifications);
		} catch (err: any) {
			next(err);
		}
	}
	public async getNotificationByUserId(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const userId = req.userId as string;
			if (!userId) {
				res.status(400).json({ message: 'User ID is required' });
			}
			const take = req.query.take
				? parseInt(req.query.take as string, 10)
				: undefined;
			const skip = req.query.skip
				? parseInt(req.query.skip as string, 10)
				: undefined;
			logger.debug(`userId: ${userId}, take: ${take}, skip: ${skip}`);
			const notifications =
				await NotificationService.getNotificationByUserId(
					userId,
					skip,
					take
				);
			const response = BaseHttpResponse.success(
				notifications,
				200,
				'Notifications retrieved successfully'
			);
			res.status(200).json(response);
		} catch (err: any) {
			next(err);
		}
	}
	public async markAsRead(req: Request, res: Response, next: NextFunction):Promise<any> {
		try {
			const userId = req.userId as string;
			
			if (!userId) {
				return res.status(400).json({ message: 'User ID is required' });
			}
			
			// Lấy notificationId từ params nếu có, nếu không thì sẽ đánh dấu tất cả
			const notificationId = req.params.notificationId;
			
			const result = await NotificationService.markAsRead(userId, notificationId);
			const response = BaseHttpResponse.success(
				result,
				200,
				'Notifications marked as read successfully'
			);
			res.status(200).json(response);
		} catch (err: any) {
			next(err);
		}
	}
	public async getUnreadCount(req: Request, res: Response, next: NextFunction):Promise<any> {
        try {
            const userId = req.userId as string;
            const refType = req.query.refType as string | undefined;
            
            if (!userId) {
                return res.status(400).json({ message: 'User ID is required' });
            }
            
            const count = await NotificationService.getUnreadCount(userId, refType);
			const response = BaseHttpResponse.success(
				count,
				200,
				'Unread count retrieved successfully'
			);
			res.status(200).json(response);
        } catch (err: any) {
            logger.error(err.message);
            res.status(500).json({ message: err.message });
            next(err);
        }
    }
	public async deleteNotification(req: Request, res: Response, next: NextFunction):Promise<any> {
		try {

			const userId = req.userId as string;
			const notificationId = req.params.notificationId;
			
			if (!userId) {
				return res.status(400).json({ message: 'User ID is required' });
			}
			
			if (!notificationId) {
				return res.status(400).json({ message: 'Notification ID is required' });
			}
			
			const result = await NotificationService.deleteNotification(userId, notificationId);
			const response = BaseHttpResponse.success(
				result,
				
				200,
				'Notifications deleted successfully'
			);
			res.status(200).json(response);
		}
		catch (err: any) {
			next(err);
		}
	}

	//admin
	public async sendNotificationByRole(req: Request, res: Response, next: NextFunction):Promise<any> {
        try {
            const { title, content, roles, isSystem, refType, refId } = req.body;
            
            if (!title || !content || !roles) {
                return res.status(400).json({ message: 'Title, content and roles are required' });
            }
            
            const result = await NotificationService.createNotificationByRole(
                title,
                content,
                roles,
                { isSystem, refType, refId }
            );
            const response = BaseHttpResponse.success(
				result,
				200,
				'Notifications marked as read successfully'
			);
            res.status(201).json(response);
        } catch (err: any) {
            next(err);
        }
    }

    public async getAdminNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const take = req.query.take ? parseInt(req.query.take as string, 10) : undefined;
            const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;
            const refType = req.query.refType as string | undefined;
            
            const notifications = await NotificationService.getAdminNotifications({
                refType,
                skip,
                take
            });
            
            const response = BaseHttpResponse.success(
                notifications,
                200,
                'Admin notifications retrieved successfully'
            );
            res.status(200).json(response);
        } catch (err: any) {
            next(err);
        }
    }

}
export default new NotificationController();
