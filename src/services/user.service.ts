import logger from '@/configs/logger.config';
import User from '@/models/user.model';
import cloudinary from '@/configs/cloudinary.config';
import mongoose, { Types } from 'mongoose';

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

	async updateAvatar(
		userId: string,
		imageFile: Express.Multer.File
	): Promise<InstanceType<typeof User> | null> {
		try {
	

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

		
			return user;

		} catch (err: any) {
			
			logger.error(`Update avatar failed!, ${err.message}`);
			throw new Error(`Update avatar failed!, ${err.message}`);
		}
	}

	async followUser(userId: string, targetUserId: string) {
		try {
			if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(targetUserId)) {
				throw new Error('Invalid user ID');
			}

			await User.findByIdAndUpdate(userId, { $addToSet: { following: targetUserId } });
			await User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: userId } });

			return { success: true, message: 'Followed successfully' };
		} catch (error: any) {
			logger.error(`Follow user failed! ${error.message}`);
			throw new Error(`Follow user failed! ${error.message}`);
		}
	}

	async unfollowUser(userId: string, targetUserId: string) {
		try {
			await User.findByIdAndUpdate(userId, { $pull: { following: targetUserId } });
			await User.findByIdAndUpdate(targetUserId, { $pull: { followers: userId } });

			return { success: true, message: 'Unfollowed successfully' };
		} catch (error: any) {
			logger.error(`Unfollow user failed! ${error.message}`);
			throw new Error(`Unfollow user failed! ${error.message}`);
		}
	}

	async getFollowing(userId: string) {
		try {
			const user = await User.findById(userId).populate('following', 'name email image');
			if (!user) throw new Error('User not found');
			return user.following;
		} catch (error: any) {
			logger.error(`Get following list failed! ${error.message}`);
			throw new Error(`Get following list failed! ${error.message}`);
		}
	}

	async getFollowers(userId: string) {
		try {
			const user = await User.findById(userId).populate('followers', 'name email image');
			if (!user) throw new Error('User not found');
			return user.followers;
		} catch (error: any) {
			logger.error(`Get followers list failed! ${error.message}`);
			throw new Error(`Get followers list failed! ${error.message}`);
		}
	}

	async isFollowingUser(userId: string, targetUserId: string): Promise<boolean> {
		try {
			const user = await User.findById(userId);
			if (!user) {
				throw new Error('User not found');
			}

			const targetObjectId = new mongoose.Types.ObjectId(targetUserId);
			return user.following.some(followedId => followedId.equals(targetObjectId));
		} catch (error: any) {
			logger.error(`Check follow status failed!, ${error.message}`);
			throw new Error(`Check follow status failed!, ${error.message}`);
		}
	}

	async requestBecomeArtist(userId: string) {
		try {
			const user = await User.findByIdAndUpdate(userId, { isRequestBecomeArtist: true }, { new: true });
			if (!user) {
				throw new Error('User not found');
			}
			return { success: true, message: 'Request to become artist submitted' };
		} catch (error: any) {
			logger.error(`Request become artist failed! ${error.message}`);
			throw new Error(`Request become artist failed! ${error.message}`);
		}
	}

	async approveBecomeArtist(userId: string) {
		try {
			const user = await User.findByIdAndUpdate(
				userId,
				{
					isRequestBecomeArtist: false,
					$addToSet: { role: 'artist' }
				},
				{ new: true }
			);
	
			if (!user) {
				throw new Error('User not found');
			}
			return { success: true, message: 'User has been granted artist role' };
		} catch (error: any) {
			logger.error(`Approve become artist failed! ${error.message}`);
			throw new Error(`Approve become artist failed! ${error.message}`);
		}
	}
	

	async getPendingArtistRequests() {
		try {
			const users = await User.find({ isRequestBecomeArtist: true }, 'name email');
			return users;
		} catch (error: any) {
			logger.error(`Get pending artist requests failed! ${error.message}`);
			throw new Error(`Get pending artist requests failed! ${error.message}`);
		}
	}
}

export default new UserService();