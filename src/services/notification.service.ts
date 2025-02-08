import Notification from '@/models/notification.model.ts';
import { FilterQuery } from 'mongoose';
import { Server, Socket } from 'socket.io';
import logger from '@/configs/logger.config.ts';
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
	}): Promise<InstanceType<typeof Notification>> {
		const notification = new Notification(data);
		const savedNotification = await notification.save();
		if (this.socketIo) {
			// const { userId, ...data } = savedNotification;
			const socketId = this.userSocketMap.get(data.userId);
			if (socketId) {
				this.socketIo
					.to(socketId)
					.emit('notifications', savedNotification);
			}
		}
		return savedNotification;
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
}
export default new NotificationService();
