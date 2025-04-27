import { injectable } from 'inversify';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@/exceptions/http-exception';
import User from '@/models/user.model';
import Artwork from '@/models/artwork.model';
import Exhibition from '@/models/exhibition.model';
import logger from '@/configs/logger.config';
import { Types } from 'mongoose';
import ArtistProfileModel from '@/models/artist-profile.model';
import { Role } from '@/constants/enum';
import { FeaturedArtist, TrendingArtist } from '@/dto/artist-request.dto';
import { ErrorCode } from '@/constants/error-code';



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

    async getFeaturedArtist(): Promise<FeaturedArtist> {
        try {
            // Find featured artist
            const user = await User.findOne({
                isFeatured: true,
                role: { $in: [Role.ARTIST] }
            })
                .select('name image artistProfile')
                .lean();

            if (!user) {
                throw new NotFoundException('No featured artist found');
            }

            // Get artist statistics
            const [artworksCount, exhibitionsCount, featuredWorks] = await Promise.all([
                // Count total approved artworks
                Artwork.countDocuments({
                    artistId: user._id,
                    moderationStatus: 'approved'
                }),

                // Count exhibitions (assuming you have an Exhibition model)
                Exhibition.countDocuments({
                    author: user._id,
                    status: 'PUBLISHED'
                }),

                // Get top 4 most viewed artworks
                Artwork.find({
                    artistId: user._id,
                    moderationStatus: 'approved'
                })
                    .sort({ views: -1 })
                    .limit(4)
                    .select('title url createdAt')
                    .lean()
            ]);

            // Transform to match Artist interface
            const artist: FeaturedArtist = {
                _id: user._id.toString(),
                name: user.name,
                image: user.image || '',
                bio: user.artistProfile?.bio || '',
                artworksCount,
                exhibitionsCount,
                featuredWorks: featuredWorks.map(work => ({
                    _id: work._id.toString(),
                    title: work.title,
                    url: work.url,
                    createdAt: work.createdAt.toISOString()
                }))
            };

            return artist;

        } catch (error) {
            logger.error('Error getting featured artist:', error);
            throw error;
        }
    }

    async setFeaturedArtist(artistId: string): Promise<InstanceType<typeof User>> {
        try {
            // First remove featured flag from any existing featured artist
            await User.updateMany(
                { isFeatured: true },
                { $set: { isFeatured: false } }
            );

            // Set the new featured artist
            const artist = await User.findOneAndUpdate(
                {
                    _id: artistId,
                    role: { $in: [Role.ARTIST] } // Ensure user is an artist
                },
                { $set: { isFeatured: true } },
                { new: true }
            );

            if (!artist) {
                throw new NotFoundException('Artist not found');
            }

            return artist;
        } catch (error) {
            logger.error('Error setting featured artist:', error);
            throw error;
        }
    }

    //  async getTrendingArtists(limit: number = 5): Promise<TrendingArtist[]> {
    //     try {
    //         // Get artists with their total artwork views
    //         const trendingArtists = await User.aggregate([
    //             // Match only artists
    //             { 
    //                 $match: { 
    //                     role: Role.ARTIST 
    //                 } 
    //             },
    //             // Lookup artworks to get views
    //             {
    //                 $lookup: {
    //                     from: 'artworks',
    //                     let: { artistId: '$_id' },
    //                     pipeline: [
    //                         {
    //                             $match: {
    //                                 $expr: { 
    //                                     $and: [
    //                                         { $eq: ['$artistId', '$$artistId'] },
    //                                         { $eq: ['$moderationStatus', 'approved'] }
    //                                     ]
    //                                 }
    //                             }
    //                         },
    //                         {
    //                             $group: {
    //                                 _id: null,
    //                                 totalViews: { $sum: '$views' }
    //                             }
    //                         }
    //                     ],
    //                     as: 'artworkStats'
    //                 }
    //             },
    //             // Add fields we need
    //             {
    //                 $addFields: {
    //                     followersCount: { $size: '$followers' },
    //                     totalViews: {
    //                         $ifNull: [
    //                             { $arrayElemAt: ['$artworkStats.totalViews', 0] },
    //                             0
    //                         ]
    //                     }
    //                 }
    //             },
    //             // Sort by total views
    //             { 
    //                 $sort: { 
    //                     totalViews: -1 
    //                 } 
    //             },

    //             // Limit results
    //             { 
    //                 $limit: limit 
    //             },

    //             // Project only needed fields
    //             {
    //                 $project: {
    //                     _id: 1,
    //                     name: 1,
    //                     image: 1,
    //                     followersCount: 1,
    //                     totalViews: 1
    //                 }
    //             }
    //         ]);

    //         return trendingArtists;

    //     } catch (error) {
    //         logger.error('Error getting trending artists:', error);
    //         throw new InternalServerErrorException(
    //             'Error retrieving trending artists',
    //             ErrorCode.DATABASE_ERROR
    //         );
    //     }
    // }

    
    //  async getTrendingArtists(limit: number = 5): Promise<TrendingArtist[]> {
    //     try {
    //         // Get artists with their total artwork views
    //         // First, get artists with the ARTIST role
    //         const artists = await User.find({ role: Role.ARTIST })
    //             .populate('followers')
    //             .select('_id name image followers')
    //             .lean();
            
    //         // Process each artist to get their artwork stats
    //         const artistsWithStats = await Promise.all(
    //             artists.map(async (artist) => {
    //                 // Count total views for artist's approved artworks
    //                 const artworks = await Artwork.find({ 
    //                     artistId: artist._id, 
    //                     moderationStatus: 'approved' 
    //                 }).select('views').lean();
                    
    //                 const totalViews = artworks.reduce(
    //                     (sum, artwork) => sum + (artwork.views || 0), 
    //                     0
    //                 );
                    
    //                 return {
    //                     _id: artist._id.toString(),
    //                     name: artist.name,
    //                     image: artist.image || '',
    //                     followersCount: artist.followers?.length || 0,
    //                     totalViews
    //                 };
    //             })
    //         );
            
    //         // Sort by total views and limit results
    //         const trendingArtists = artistsWithStats
    //             .sort((a, b) => b.totalViews - a.totalViews)
    //             .slice(0, limit);

    //         return trendingArtists;

    //     } catch (error) {
    //         logger.error('Error getting trending artists:', error);
    //         throw new InternalServerErrorException(
    //             'Error retrieving trending artists',
    //             ErrorCode.DATABASE_ERROR
    //         );
    //     }
    // }


    //artist ma nhieu thi hoi cang
    async getTrendingArtists(limit: number = 5): Promise<TrendingArtist[]> {
    try {
        const trendingArtists = await User.aggregate([
            // Match only artists
            { 
                $match: { 
                    role: Role.ARTIST 
                } 
            },
            // Lookup artworks stats
            {
                $lookup: {
                    from: 'artworks',
                    let: { artistId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { 
                                    $and: [
                                        { $eq: ['$artistId', '$$artistId'] },
                                        { $eq: ['$moderationStatus', 'approved'] }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalViews: { $sum: '$views' },
                                artworksCount: { $sum: 1 },
                                averagePrice: { $avg: '$price' }
                            }
                        }
                    ],
                    as: 'artworkStats'
                }
            },
            // Lookup exhibitions stats
            {
                $lookup: {
                    from: 'exhibitions',
                    let: { authorId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { 
                                    $and: [
                                        { $eq: ['$author', '$$authorId'] },
                                        { $eq: ['$status', 'PUBLISHED'] }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                exhibitionViews: { $sum: '$result.visits' },
                                exhibitionsCount: { $sum: 1 }
                            }
                        }
                    ],
                    as: 'exhibitionStats'
                }
            },
            // Calculate engagement scores
            {
                $addFields: {
                    followersCount: { $size: '$followers' },
                    artworkStats: { $arrayElemAt: ['$artworkStats', 0] },
                    exhibitionStats: { $arrayElemAt: ['$exhibitionStats', 0] },
                    // Calculate trending score based on multiple factors
                    trendingScore: {
                        $add: [
                            // Artwork views (30%)
                            { 
                                $multiply: [
                                    { $ifNull: [{ $arrayElemAt: ['$artworkStats.totalViews', 0] }, 0] },
                                    0.3
                                ]
                            },
                            // Exhibition views (20%)
                            {
                                $multiply: [
                                    { $ifNull: [{ $arrayElemAt: ['$exhibitionStats.exhibitionViews', 0] }, 0] },
                                    0.3
                                ]
                            },
                            // Followers count (25%)
                            {
                                $multiply: [
                                    { $size: '$followers' },
                                    0.25
                                ]
                            },
                            // Content count - artworks + exhibitions (15%)
                            {
                                $multiply: [
                                    {
                                        $add: [
                                            { $ifNull: [{ $arrayElemAt: ['$artworkStats.artworksCount', 0] }, 0] },
                                            { $ifNull: [{ $arrayElemAt: ['$exhibitionStats.exhibitionsCount', 0] }, 0] }
                                        ]
                                    },
                                    0.15
                                ]
                            }
                        ]
                    }
                }
            },
            // Sort by trending score
            { 
                $sort: { 
                    trendingScore: -1 
                } 
            },
            // Limit results
            { 
                $limit: limit 
            },
            // Project final fields
            {
                $project: {
                    _id: 1,
                    name: 1,
                    image: 1,
                    followersCount: 1,
                    artworksCount: '$artworkStats.artworksCount',
                    exhibitionsCount: '$exhibitionStats.exhibitionsCount',
                    totalViews: {
                        $add: [
                            { $ifNull: ['$artworkStats.totalViews', 0] },
                            { $ifNull: ['$exhibitionStats.exhibitionViews', 0] }
                        ]
                    },
                    trendingScore: 1
                }
            }
        ]);

        return trendingArtists;

    } catch (error) {
        logger.error('Error getting trending artists:', error);
        throw new InternalServerErrorException(
            'Error retrieving trending artists',
            ErrorCode.DATABASE_ERROR
        );
    }
}
} 