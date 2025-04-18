import { injectable } from 'inversify';
import { BadRequestException, NotFoundException } from '@/exceptions/http-exception';
import User from '@/models/user.model';
import logger from '@/configs/logger.config';
import { Types } from 'mongoose';
import  ArtistProfileModel  from '@/models/artist-profile.model';
import { Role } from '@/constants/enum';



// Interface cho dữ liệu cập nhật profile
interface ArtistProfileUpdate {
    bio?: string;
    genre?: string;
    experience?: string;
    socialLinks?: {
        instagram?: string;
        twitter?: string;
        website?: string;
    };
    careerStartDate?: Date;
    achievements?: string[];
}

interface PaginationResult<T> {
    items: T[];
    total: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

@injectable()
export class ArtistService {
    // Get artist profile by ID
    async getArtistProfile(
        artistId: string
    ): Promise<InstanceType<typeof User>> {
        try {
            const artist = await User.findById(artistId);
            if (!artist) {
                throw new NotFoundException('Artist not found');
            }

            return artist;
        } catch (err: any) {
            logger.error(`Get artist profile failed: ${err.message}`);
            throw err;
        }
    }

    // Update artist profile
    async updateArtistProfile(
        artistId: string,
        updateData: ArtistProfileUpdate
    ): Promise<{ user: InstanceType<typeof User>, profile: InstanceType<typeof ArtistProfileModel> }> {
        try {
            // Validate ObjectId
            if (!Types.ObjectId.isValid(artistId)) {
                throw new BadRequestException('Invalid artist ID format');
            }

            // Validate update data
            if (Object.keys(updateData).length === 0) {
                throw new BadRequestException('No update data provided');
            }

            // Tìm user và kiểm tra role artist
            const existingArtist = await User.findOne({
                _id: artistId,
                role: Role.ARTIST
            });

            if (!existingArtist) {
                throw new NotFoundException('Artist not found');
            }

            // Tìm artist profile
            let artistProfile = await ArtistProfileModel.findOne({ userId: artistId });

            if (!artistProfile) {
                // Nếu chưa có profile thì tạo mới
                artistProfile = new ArtistProfileModel({
                    userId: artistId,
                    bio: updateData.bio || "",
                    genre: updateData.genre || []
                });
            } else {
                // Cập nhật profile hiện có
                if (updateData.bio !== undefined) {
                    artistProfile.bio = updateData.bio;
                }
                if (updateData.genre !== undefined) {
                    artistProfile.genre = Array.isArray(updateData.genre)
                        ? updateData.genre
                        : [updateData.genre];
                }
            }

            // Lưu thay đổi vào bảng artistprofiles
            await artistProfile.save();

            // Cập nhật lại thông tin trong user model
            const updatedArtist = await User.findByIdAndUpdate(
                artistId,
                {
                    $set: {
                        artistProfile: {
                            bio: artistProfile.bio,
                            genre: artistProfile.genre
                        }
                    }
                },
                { new: true }
            ).select('-password');

            if (!updatedArtist) {
                throw new Error('Failed to update artist profile');
            }

            logger.info(`Updated artist profile for user ${artistId}`);

            return {
                user: updatedArtist,
                profile: artistProfile
            };
        } catch (err: any) {
            logger.error(`Update artist profile failed: ${err.message}`);
            throw err;
        }
    }

    // Get all artists with pagination
    async getAllArtists(
        page: number = 1,
        limit: number = 10
    ): Promise<PaginationResult<InstanceType<typeof User>>> {
        try {
            // Validate pagination params
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100; // Maximum limit

            const skip = (page - 1) * limit;

            const [artists, total] = await Promise.all([
                User.find({ isArtist: true })
                    .select('-password')
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 }),
                User.countDocuments({ isArtist: true })
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                items: artists,
                total,
                page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            };
        } catch (err: any) {
            logger.error(`Get all artists failed: ${err.message}`);
            throw err;
        }
    }

    // Search artists with pagination
    async searchArtists(
        searchTerm: string,
        page: number = 1,
        limit: number = 10
    ): Promise<PaginationResult<InstanceType<typeof User>>> {
        try {
            // Validate search term
            if (!searchTerm || searchTerm.trim().length === 0) {
                throw new BadRequestException('Search term is required');
            }

            // Validate pagination params
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100; // Maximum limit

            const skip = (page - 1) * limit;
            const sanitizedSearchTerm = searchTerm.trim();

            const searchQuery = {
                isArtist: true,
                $or: [
                    { name: { $regex: sanitizedSearchTerm, $options: 'i' } },
                    { 'artistProfile.genre': { $regex: sanitizedSearchTerm, $options: 'i' } },
                    { 'artistProfile.bio': { $regex: sanitizedSearchTerm, $options: 'i' } }
                ]
            };

            const [artists, total] = await Promise.all([
                User.find(searchQuery)
                    .select('-password')
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 }),
                User.countDocuments(searchQuery)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                items: artists,
                total,
                page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            };
        } catch (err: any) {
            logger.error(`Search artists failed: ${err.message}`);
            throw err;
        }
    }

    async editArtistProfile(
        userId: string,
        profileId: string,
        updateData: ArtistProfileUpdate
    ): Promise<InstanceType<typeof ArtistProfileModel>> {
        try {
            // Validate ObjectIds
            if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(profileId)) {
                throw new BadRequestException('Invalid ID format');
            }

            // Validate update data
            if (Object.keys(updateData).length === 0) {
                throw new BadRequestException('No update data provided');
            }

            // Kiểm tra xem profile có tồn tại và thuộc về user không
            const existingProfile = await ArtistProfileModel.findOne({
                _id: profileId,
                userId: userId
            });

            if (!existingProfile) {
                throw new NotFoundException('Artist profile not found or unauthorized');
            }

            // Validate social links nếu có
            if (updateData.socialLinks) {
                const socialLinks = updateData.socialLinks;
                for (const [platform, url] of Object.entries(socialLinks)) {
                    if (url && !url.match(/^https?:\/\//)) {
                        throw new BadRequestException(
                            `Invalid ${platform} URL. Must start with http:// or https://`
                        );
                    }
                }
            }

            // Cập nhật profile
            const updatedProfile = await ArtistProfileModel.findByIdAndUpdate(
                profileId,
                {
                    $set: {
                        ...updateData,
                        updatedAt: new Date()
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!updatedProfile) {
                throw new Error('Failed to update artist profile');
            }

            return updatedProfile;
        } catch (err: any) {
            logger.error(`Edit artist profile failed: ${err.message}`);
            throw err;
        }
    }

    async updateUserToArtist(
        userId: string
    ): Promise<{ user: InstanceType<typeof User>, profile: InstanceType<typeof ArtistProfileModel> }> {
        try {
            // Validate ObjectId
            if (!Types.ObjectId.isValid(userId)) {
                throw new BadRequestException('Invalid user ID format');
            }

            // Find the user
            const user = await User.findById(userId);
            if (!user) {
                throw new NotFoundException('User not found');
            }

            // Check if user already has artist role
            if (user.role.includes(Role.ARTIST)) {
                // Check if artist profile already exists
                const existingProfile = await ArtistProfileModel.findOne({ userId });
                if (existingProfile) {
                    return { user, profile: existingProfile };
                }
            } else {
                // Add artist role to user
                user.role.push(Role.ARTIST);
                await user.save();
            }

            // Create empty artist profile
            const newArtistProfile = new ArtistProfileModel({
                userId: user._id,
                bio: "",
                genre: [], // Empty array as per the model requirement
            });

            await newArtistProfile.save();
            logger.info(`User ${userId} updated to artist with profile created`);

            return {
                user,
                profile: newArtistProfile
            };
        } catch (error) {
            logger.error('Error updating user to artist:', error);
            throw error;
        }
    }
} 