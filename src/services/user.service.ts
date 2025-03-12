import logger from '@/configs/logger.config';
import User from '@/models/user.model';
import cloudinary from '@/configs/cloudinary.config';

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

	async updateAvatar(
		userId: string,
		imageFile: Express.Multer.File
	): Promise<InstanceType<typeof User> | null> {
		try {
			console.log('Starting avatar update for user:', userId);
			console.log('Image file:', imageFile);

			if (!imageFile) {
				throw new Error('No image file provided');
			}

			// Upload image to Cloudinary
			const result = await cloudinary.uploader.upload(imageFile.path, {
				folder: 'avatars',
				transformation: [
					{ width: 400, height: 400, crop: 'fill' },
					{ quality: 'auto' }
				]
			});

			console.log('Cloudinary upload result:', result);

			// Update user's avatar URL in database using findOneAndUpdate
			const user = await User.findOneAndUpdate(
				{ _id: userId },
				{
					$set: {
						image: result.secure_url,
						googleImage: null
					}
				},
				{
					new: true,
					runValidators: true // Đảm bảo validate theo schema
				}
			);

			if (!user) {
				logger.error(`User not found with ID: ${userId}`);
				throw new Error('User not found');
			}

			console.log('Updated user in database:', user);
			return user;

		} catch (err: any) {
			console.error('Error in updateAvatar:', err);
			logger.error(`Update avatar failed!, ${err.message}`);
			throw new Error(`Update avatar failed!, ${err.message}`);
		}
	}
}

export default new UserService();