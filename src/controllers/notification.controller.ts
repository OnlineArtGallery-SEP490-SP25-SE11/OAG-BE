import { NextFunction, Request, Response } from 'express';
import NotificationService from '@/services/notification.service';
import logger from '@/configs/logger.config.ts';
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
			logger.error(err.message);
			res.status(500).json({ message: err.message });
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
			logger.error(err.message);
			res.status(500).json({ message: err.message });
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
			res.status(200).json(notifications);
		} catch (err: any) {
			logger.error(err.message);
			res.status(500).json({ message: err.message });
			next(err);
		}
	}
}
export default new NotificationController();
