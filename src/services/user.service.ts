import logger from '@/configs/logger.config';
import User from '@/models/user.model';
import mongoose from 'mongoose';
import { Role } from '@/constants/enum';
class UserService {
	async getUserByPhone(
		phone: string
	): Promise<InstanceType<typeof User> | null> {
		try {
			return await User.findOne({ phone });
		} catch (error: any) {
			logger.error(`Get user by phone failed!, ${error.message}`);
			throw new Error(`Get user by phone failed!, ${error.message}`);
		}
	}

	async getProfile(
		userId: string
	): Promise<InstanceType<typeof User> | null> {
		try {
			const user = await User.findById(userId);
			if (!user) {
				logger.error(`User not found!`);
				throw new Error('User not found');
			}
			return user;
		} catch (err: any) {
			logger.error(`Get profile failed!, ${err.message}`);
			throw new Error(`Get profile failed!, ${err.message}`);
		}
	}

	async updateProfile(
		userId: string,
		update: Partial<InstanceType<typeof User>>
	): Promise<InstanceType<typeof User> | null> {
		try {
			const user = await User.findByIdAndUpdate(userId, update, {
				new: true
			});
			if (!user) {
				logger.error(`User not found!`);
				throw new Error('User not found');
			}
			return user;
		} catch (err: any) {
			logger.error(`Update profile failed!, ${err.message}`);
			throw new Error(`Update profile failed!, ${err.message}`);
		}
	} 

	//admin function user
	async getAllUser(): Promise<InstanceType<typeof User>[]> {
		try {
			const users = await User.find();
			return users;
		}
		catch{
			logger.error(`Get all user failed!`);
			throw new Error(`Get all user failed!`);
		}
	}
	//get artist
	async getArtist(): Promise<InstanceType<typeof User>[]> {
		try{
			const artist = await User.find({ role: 'artist' });
		return artist;
		}
		catch{
			logger.error(`Get artist failed!`);
			throw new Error(`Get artist failed!`);
		}
	}

	//get user by id
	async getUserById(userId: string): Promise<InstanceType<typeof User> | null> {
		try{
			if (!userId) {
				logger.error(`User not found!`);
				throw new Error('User not found');
			}
			const user = await User.findById(userId);
			return user;
		}
		catch(error){
			logger.error(`Get user by id failed!`);
			throw new Error(`Get user by id failed!`);

		}
	}

	//update role
	async updateRole(
		userId: string,
		role: Role
	): Promise<InstanceType<typeof User> | null> {
		try{
			if (!userId) {
				logger.error(`User not found!`);
				throw new Error('User not found');
			}
			const validRole = ['user', 'artist', 'admin'];
			if(!validRole){
				logger.error(`Role not found!`);
				throw new Error('Role not found');
			}

			const user = await User.findByIdAndUpdate(
				userId,
				{ role },
				{ new: true }
			)
			logger.info(`Successfully updated role of user ${userId} to ${role}`);
			return user;
		}
		catch{
			logger.error(`Update role failed!`);
			throw new Error(`Update role failed!`);
		}
	}
		
}

export default new UserService();