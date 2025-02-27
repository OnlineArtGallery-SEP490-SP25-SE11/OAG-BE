import { Server } from 'socket.io';
import env from '@/utils/validateEnv.util.ts';
import { Server as HttpServer } from 'http';
import logger from '@/configs/logger.config.ts';
class SocketConfig {
	private io: Server | null = null;
	public init(httpServer: HttpServer) {
		if (!this.io) {
			this.io = new Server(httpServer, {
				cors: {
					origin: env.CLIENT_URL,
					methods: ['*']
				}
			});
			logger.info('👌Socket.io is running');
		}
	}
	public getIO() {
		if (!this.io) {
			logger.error('Socket.io is not initialized!');
			throw new Error('Socket.io is not initialized!');
		}
		return this.io;
	}
}
export default new SocketConfig();
