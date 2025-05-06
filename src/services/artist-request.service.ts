import { injectable, inject } from 'inversify';
import { TYPES } from '@/constants/types';
import ArtistRequestModel, { ArtistRequestStatus, ArtistRequest } from '@/models/artist-request.model';
import { CreateArtistRequestDto, UpdateArtistRequestStatusDto } from '@/dto/artist-request.dto';
import mongoose from 'mongoose';
import NotificationService from './notification.service';
import logger from '@/configs/logger.config';
import User from '@/models/user.model';
import { CCCDService } from './cccd.service';
import { InternalServerErrorException, NotFoundException, BadRequestException } from '@/exceptions/http-exception';
import { ErrorCode } from '@/constants/error-code';

export interface ArtistRequestQueryOptions {
    page?: number;
    limit?: number;
    sort?: Record<string, 1 | -1>;
    filter?: {
        status?: ArtistRequestStatus;
        userId?: string;
        cccdId?: string;
    };
    search?: string;
}

export interface PaginatedArtistRequestResponse {
    requests: any[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
@injectable()
export class ArtistRequestService {
    constructor(
        @inject(TYPES.CCCDService) private readonly cccdService: CCCDService
    ) { }

    async getRequests(options: ArtistRequestQueryOptions = {}): Promise<PaginatedArtistRequestResponse> {
        try {
            const {
                page = 1,
                limit = 10,
                sort = { createdAt: -1 },
                filter = {},
                search
            } = options;

            // Build query filters
            const query: Record<string, any> = { ...filter };

            if (search) {
                // Search by user information through population
                // We'll handle this in the aggregation pipeline
            }

            // Calculate pagination
            const skip = (page - 1) * limit;

            // If we need to search across related fields in the user document
            if (search) {
                // Use aggregation pipeline to search through populated fields
                const aggregation = [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'user'
                        }
                    },
                    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                    {
                        $match: {
                            ...query,
                            $or: [
                                { 'user.name': { $regex: search, $options: 'i' } },
                                { 'user.email': { $regex: search, $options: 'i' } },
                                { cccd: { $regex: search, $options: 'i' } }
                            ]
                        }
                    },
                    {
                        $facet: {
                            metadata: [{ $count: 'total' }],
                            data: [
                                { $sort: sort },
                                { $skip: skip },
                                { $limit: limit },
                                // Lookup related documents for response
                                {
                                    $lookup: {
                                        from: 'users',
                                        localField: 'reviewedBy',
                                        foreignField: '_id',
                                        as: 'reviewer'
                                    }
                                },
                                { $unwind: { path: '$reviewer', preserveNullAndEmptyArrays: true } }
                            ]
                        }
                    }
                ];

                const [result] = await ArtistRequestModel.aggregate(aggregation);

                const requests = result.data;
                const total = result.metadata[0]?.total || 0;
                const pages = Math.ceil(total / limit);

                return {
                    requests,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages,
                        hasNext: page < pages,
                        hasPrev: page > 1
                    }
                };
            } else {
                // If no search needed, use regular find for better performance
                const [requests, total] = await Promise.all([
                    ArtistRequestModel.find(query)
                        .populate('userId', 'name email image')
                        .populate('reviewedBy', 'name email')
                        .populate('cccd')
                        .sort(sort)
                        .skip(skip)
                        .limit(limit),
                    ArtistRequestModel.countDocuments(query)
                ]);

                const pages = Math.ceil(total / limit);

                return {
                    requests,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages,
                        hasNext: page < pages,
                        hasPrev: page > 1
                    }
                };
            }
        } catch (error) {
            logger.error('Error retrieving artist requests:', error);
            throw new InternalServerErrorException(
                'Error retrieving artist requests',
                ErrorCode.DATABASE_ERROR
            );
        }
    }


    async createRequest(userId: string, data: CreateArtistRequestDto): Promise<ArtistRequest> {
        try {
            // Check if user already has a pending request
            const existingRequest = await ArtistRequestModel.findOne({ userId });
            if (existingRequest) {
                if (existingRequest.status === ArtistRequestStatus.PENDING) {
                    throw new Error('You already have a pending artist request');
                } else if (existingRequest.status === ArtistRequestStatus.APPROVED) {
                    throw new Error('You are already an approved artist');
                }
                // If rejected, allow to create a new request by deleting the old one
                await ArtistRequestModel.deleteOne({ _id: existingRequest._id });
            }
            if (!data.cccd) {
                throw new BadRequestException('CCCD is required to create an artist request');
            }

            //save new cccd
            const cccd = await this.cccdService.createCCCD(userId,data.cccd);
            if (!cccd) {
                throw new InternalServerErrorException('Failed to create CCCD');
            }

            // Create new artist request
            const artistRequest = new ArtistRequestModel({
                userId: new mongoose.Types.ObjectId(userId),
                cccd: cccd._id,
                status: ArtistRequestStatus.PENDING
            });

            await artistRequest.save();

            // Send notification to admins
            await NotificationService.createNotification({
                title: 'New Artist Application',
                content: `Request has been submitted an application to become an artist`,
                userId: userId,
                isSystem: true,
                refType: 'artist-request',
                refId: artistRequest._id as string
            });

            logger.info(`User ${userId} submitted artist request with ID ${artistRequest._id}`);
            return artistRequest;

        } catch (error: any) {
            logger.error(`Error creating artist request: ${error.message}`);
            throw error;
        }
    }

    async getRequestById(requestId: string): Promise<ArtistRequest | null> {
        return ArtistRequestModel.findById(requestId)
            .populate('userId', 'name email image')
            .populate('reviewedBy', 'name email')
            .populate('cccd');
    }

    async getRequestByUserId(userId: string): Promise<ArtistRequest | null> {
        return ArtistRequestModel.findOne({ userId })
            .populate('userId', 'name email image')
            .populate('reviewedBy', 'name email')
            .populate('cccd');
    }

    async getPendingRequests(limit = 10, page = 1): Promise<{ requests: ArtistRequest[]; total: number }> {
        const skip = (page - 1) * limit;

        const [requests, total] = await Promise.all([
            ArtistRequestModel.find({ status: ArtistRequestStatus.PENDING })
                .populate('userId', 'name email image')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ArtistRequestModel.countDocuments({ status: ArtistRequestStatus.PENDING })
        ]);

        return { requests, total };
    }

    async updateRequestStatus(
        requestId: string,
        adminId: string,
        data: UpdateArtistRequestStatusDto
    ): Promise<ArtistRequest> {
        try {
            const artistRequest = await ArtistRequestModel.findById(requestId);
            if (!artistRequest) {
                throw new NotFoundException('Artist request not found');
            }

            if (artistRequest.status !== ArtistRequestStatus.PENDING) {
                throw new BadRequestException('This request has already been processed');
            }

            artistRequest.status = data.status as ArtistRequestStatus;
            artistRequest.reviewedBy = new mongoose.Types.ObjectId(adminId);
            artistRequest.reviewedAt = new Date();

            if (data.status === ArtistRequestStatus.REJECTED && data.rejectionReason) {
                artistRequest.rejectionReason = data.rejectionReason;
            }

            await artistRequest.save();

            // If approved, update user role to artist
            if (data.status === ArtistRequestStatus.APPROVED) {
                await User.findByIdAndUpdate(
                    artistRequest.userId,
                    {
                        isRequestBecomeArtist: false,
                        $addToSet: { role: 'artist' }
                    }
                );

                // Notify user about approval
                await NotificationService.createNotification({
                    title: 'Artist Status Approved',
                    content: 'Congratulations! Your application to become an artist has been approved. You can now upload and sell your artwork.',
                    userId: artistRequest.userId.toString(),
                    isSystem: true,
                    refType: 'artist-request',
                    refId: artistRequest._id as string
                });
            } else {

                //delete cccd
                await this.cccdService.deleteCCCD(artistRequest.cccd!.toString());
                //delete artist request
                await ArtistRequestModel.deleteOne({ _id: artistRequest._id });
                // Notify user about rejection
                await NotificationService.createNotification({
                    title: 'Artist Status Update',
                    content: `Your application to become an artist was not approved. Reason: ${data.rejectionReason || 'Not specified'}`,
                    userId: artistRequest.userId.toString(),
                    isSystem: true,
                    refType: 'artist-request',
                    refId: artistRequest._id as string

                });
            }

            logger.info(`Artist request ${requestId} was ${data.status} by admin ${adminId}`);
            return artistRequest;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            logger.error(`Error updating artist request status: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw new InternalServerErrorException(
                'Failed to update artist request status',
                ErrorCode.DATABASE_ERROR
            );
        }
    }
}