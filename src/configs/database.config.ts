import env from '@/utils/validateEnv.util';
import mongoose from 'mongoose';
import logger from './logger.config';
class DatabaseConfig {
	public async connect(): Promise<void> {
		try {
			await mongoose.connect(env.MONGO_URI, {});
			logger.info('👌Connected to MongoDB');
		} catch (err: any) {
			logger.error('💔 Failed to connect to MongoDB', err.message);
		}
	}
}
export default new DatabaseConfig();
