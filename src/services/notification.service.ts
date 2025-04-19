import Notification from '@/models/notification.model.ts';
import { FilterQuery, PipelineStage } from 'mongoose';
import { Server, Socket } from 'socket.io';
import logger from '@/configs/logger.config.ts';
import User from '@/models/user.model'
/**
 * Đây là service sử dụng socket, do đó sẽ được khởi tạo cùng lúc với server nên sẽ new trực tiếp.
 * Sử dụng hàm init để khởi tạo, hàm start để bắt đầu chạy.
 * Sau khi chạy có thể sử dụng hàm create và hàm get
 * @example
 * ```typescript
 * import NotificationService from "@/services/notification.service.ts";
 * await NotificationService.createNotification({
 *  title: "Hello",
 *  content: "World",
 *  userId: "123"
 *  })
 *  ```
 * Service này sẽ quản lý việc gửi thông báo tới client thông qua socket
 * */

class NotificationService {
	private socketIo: Server | null = null;
	private userSocketMap: Map<string, string>;
	constructor() {
		this.userSocketMap = new Map();
	}
	public init(socket: Server): void {
		this.socketIo = socket;
		this.start();
	}
	private start(): void {
		if (!this.socketIo) {
			logger.error('Socket.io is not initialized!');
			throw new Error('Socket.io is not initialized!');
		}
		logger.info('👌Notification service is running');
		this.socketIo.on('connection', async (socket) => {
			await this.handleConnection(socket);
		});
	}
	private async handleConnection(socket: Socket): Promise<void> {
		socket.on('register', async (userId: string) => {
			await this.connectedUser(userId, socket.id);
			logger.info(`User ${userId} registered`);
		});
		socket.on(
			'createNotification',
			async (data: {
				title: string;
				content?: string;
				userId: string;
			}) => {
				const saveNotification = await this.createNotification(data);
				socket.emit('notificationCreated', saveNotification);
			}
		);
		socket.on('getNotifications', async () => {
			const notifications = await this.getNotifications();
			socket.emit('notifications', JSON.stringify(notifications));
		});
		socket.on('disconnect', async () => {
			await this.disconnectedUser(socket.id);
		});
	}
	private async connectedUser(
		userId: string,
		socketId: string
	): Promise<void> {
		this.userSocketMap.set(userId, socketId);
		logger.info(`User ${userId} connected`);
	}
	private async disconnectedUser(userId: string): Promise<void> {
		this.userSocketMap.delete(userId);
		logger.info(`User ${userId} disconnected`);
	}
	public async createNotification(data: {
		title: string;
		content?: string;
		userId: string;
		isSystem?: boolean;
		refType?: string;
		refId?: string;
	}): Promise<InstanceType<typeof Notification>> {
		const notification = new Notification({
			title: data.title,
			content: data.content,
			userId: data.userId,
			isSystem: data.isSystem !== undefined ? data.isSystem : true,
			refType: data.refType || 'system',
			refId: data.refId
		});
		
		const savedNotification = await notification.save();
		
		if (this.socketIo) {
			const socketId = this.userSocketMap.get(data.userId);
			if (socketId) {
				this.socketIo
					.to(socketId)
					.emit('notifications', savedNotification);
			}
		}
		
		return savedNotification;
	}
	public async createNotificationByRole(
		title: string,
		content: string,
		roles: string | string[], // Hỗ trợ một hoặc nhiều role
		options?: {
			isSystem?: boolean;
			refType?: string;
			refId?: string;
		}
	): Promise<{ count: number }> {
		// Chuyển đổi sang mảng nếu chỉ truyền vào một string
		const roleArray = Array.isArray(roles) ? roles : [roles];
		
		// Tìm users có role trong danh sách
		const users = await User.find({ role: { $in: roleArray } });
		
		if (!users || users.length === 0) {
			return { count: 0 };
		}
	
		// Giữ nguyên cách xử lý hiện tại - đơn giản và đáng tin cậy
		const notificationPromises = users.map(user => 
			this.createNotification({
				title,
				content,
				userId: user._id as string,
				isSystem: options?.isSystem,
				refType: options?.refType,
				refId: options?.refId
			})
		);
		
		const notifications = await Promise.all(notificationPromises);
		return { count: notifications.length };
	}
	public async markAsRead(userId: string, notificationId?: string): Promise<{ modified: number }> {
		try {
			// Tạo query object với TypeScript đúng cách
			const query: FilterQuery<typeof Notification> = { userId };
			
			// Nếu có notificationId, chỉ đánh dấu một thông báo cụ thể
			if (notificationId) {
				query._id = notificationId;
			}
			
			const result = await Notification.updateMany(
				query,
				{ isRead: true }
			);
			
			return { modified: result.modifiedCount };
		} catch (error) {
			logger.error(`Error marking notifications as read: ${error}`);
			throw error;
		}
	}
	public async getUnreadCount(userId: string, refType?: string): Promise<number> {
		try {
			const query: FilterQuery<typeof Notification> = { 
				userId, 
				isRead: false 
			};			
			if (refType) {
				query.refType = refType;
			}
			return await Notification.countDocuments(query);
		} catch (error) {
			logger.error(`Error getting unread notification count: ${error}`);
			throw error;
		}
	}
	public async getNotifications(): Promise<
		InstanceType<typeof Notification>[]
	> {
		return await Notification.find().sort({ createdAt: -1 }).exec();
	}
	public async getNotificationByUserId(
		userId: string,
		skip?: number,
		take?: number
	): Promise<{
		notifications: InstanceType<typeof Notification>[];
		total: number;
	}> {
		const query: FilterQuery<typeof Notification> = { userId };

		let notificationQuery = Notification.find(query).sort({
			createdAt: -1
		});

		if (typeof skip === 'number' && skip >= 0) {
			notificationQuery = notificationQuery.skip(skip);
		}
		if (typeof take === 'number' && take > 0) {
			notificationQuery = notificationQuery.limit(take);
		}
		const [notifications, total] = await Promise.all([
			notificationQuery.exec(),
			Notification.countDocuments(query)
		]);

		return { notifications, total };
	}
	public async getAdminNotifications(
		options?: {
			refType?: string;
			skip?: number;
			take?: number;
		}
	): Promise<{
		notifications: any[];
		total: number;
	}> {
		try {
			// Tạo query - chỉ lấy thông báo isSystem = false (do admin tạo)
			const query: FilterQuery<typeof Notification> = { 
				isSystem: false 
			};
			
			// Lọc thêm theo refType nếu có
			if (options?.refType) {
				query.refType = options.refType;
			}
			
			// Thực hiện aggregation để gom nhóm thông báo theo nội dung
			const aggregationPipeline: PipelineStage[] = [
				{ $match: query },
				{ 
					$sort: { createdAt: -1 } // -1 là giảm dần
				},
				{
					$group: {
						_id: {
							title: "$title",
							content: "$content",
							refType: "$refType",
							refId: "$refId",
							createdAt: {
								$dateToString: {
									format: "%Y-%m-%d %H:%M:%S",
									date: "$createdAt"
								}
							}
						},
						notificationId: { $first: "$_id" },
						title: { $first: "$title" },
						content: { $first: "$content" },
						refType: { $first: "$refType" },
						refId: { $first: "$refId" },
						createdAt: { $first: "$createdAt" },
						recipientCount: { $sum: 1 },
						readCount: { 
							$sum: { $cond: [{ $eq: ["$isRead", true] }, 1, 0] } // Cú pháp $cond đúng
						},
						recipients: {
							$push: {
								userId: "$userId",
								isRead: "$isRead"
							}
						}
					}
				},
				{
					$project: {
						_id: "$notificationId",
						title: 1,
						content: 1,
						refType: 1,
						refId: 1,
						createdAt: 1,
						stats: {
							totalRecipients: "$recipientCount",
							readCount: "$readCount",
							readPercentage: {
								$multiply: [
									{ $divide: ["$readCount", { $max: ["$recipientCount", 1] }] },
									100
								]
							}
						},
						sampleRecipients: { $slice: ["$recipients", 0, 3] }
					}
				}
			];
			
			// Áp dụng skip/take cho kết quả của aggregation
			if (typeof options?.skip === 'number' && options.skip >= 0) {
				aggregationPipeline.push({ 
					$skip: options.skip 
				} as PipelineStage);
			}
			
			if (typeof options?.take === 'number' && options.take > 0) {
				aggregationPipeline.push({ 
					$limit: options.take 
				} as PipelineStage);
			}
			
			// Thực hiện aggregation
			const notifications = await Notification.aggregate(aggregationPipeline);
			
			// Đếm tổng số nhóm thông báo
			const countPipeline: PipelineStage[] = [
				{ $match: query },
				{
					$group: {
						_id: {
							title: "$title",
							content: "$content",
							refType: "$refType",
							refId: "$refId",
							createdAt: {
								$dateToString: {
									format: "%Y-%m-%d %H:%M:%S",
									date: "$createdAt"
								}
							}
						}
					}
				},
				{
					$count: "total"
				}
			];
			
			const totalResult = await Notification.aggregate(countPipeline);
			const total = totalResult.length > 0 ? totalResult[0].total : 0;
			
			return { notifications, total };
		} catch (error) {
			logger.error(`Error getting admin notifications: ${error}`);
			throw error;
		}
	}	
	public async deleteNotification(
		userId: string,
		notificationId: string
	): Promise<{ success: boolean }> {
		try {
			const result = await Notification.deleteOne({
				_id: notificationId,
				userId
			});
			
			return { success: result.deletedCount > 0 };
		} catch (error) {
			logger.error(`Error deleting notification: ${error}`);
			throw error;
		}
	}
}
export default new NotificationService();
