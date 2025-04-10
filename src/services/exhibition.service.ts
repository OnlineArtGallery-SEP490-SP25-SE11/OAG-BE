import { injectable, inject } from 'inversify';
import { Error, Types } from 'mongoose';
import ExhibitionModel, { ExhibitionDocument, Exhibition } from '@/models/exhibition.model';
import logger from '@/configs/logger.config';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@/exceptions/http-exception';
import { ErrorCode } from '@/constants/error-code';
import { CreateEmptyExhibitionDto, TicketPurchaseResponse, UpdateExhibitionDto } from '@/dto/exhibition.dto';
import { IExhibitionService, ExhibitionQueryOptions, PaginatedExhibitionResponse } from '@/interfaces/service/exhibition-service.interface';
import { ExhibitionFactory } from '@/factorires/exhitition.factory';
import { GalleryModel } from '@/models/gallery.model';
import { ExhibitionStatus } from '@/constants/enum';
import NotificationService from '@/services/notification.service';
import { TYPES } from '@/constants/types';
import WalletService from './wallet.service';
import Wallet from '@/models/wallet.model';

@injectable()
export class ExhibitionService implements IExhibitionService {
    constructor(
        @inject(TYPES.WalletService) private _walletService: WalletService
    ) { }

    async create(data: CreateEmptyExhibitionDto & { author: string }): Promise<ExhibitionDocument> {
        try {
            // Validate gallery existence
            const galleryExists = await GalleryModel.exists({ _id: data.gallery });
            if (!galleryExists) {
                throw new BadRequestException('Gallery not found', ErrorCode.NOT_FOUND);
            }
            // Use factory to create exhibition object
            const exhibitionData = ExhibitionFactory.createEmpty(
                data.gallery,
                data.author,
            );
            const exhibition = await ExhibitionModel.create(exhibitionData);
            return exhibition;
        } catch (error) {
            logger.error('Error creating exhibition:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            if (error instanceof Error.ValidationError) {
                throw new BadRequestException(
                    'Invalid exhibition data',
                    ErrorCode.VALIDATION_ERROR,
                    error.errors
                );
            }
            throw new InternalServerErrorException(
                'Error creating exhibition',
                ErrorCode.DATABASE_ERROR
            );
        }
    }

    async findById(id: string): Promise<ExhibitionDocument | null> {
        try {
            if (!Types.ObjectId.isValid(id)) {
                throw new BadRequestException('Invalid exhibition ID format');
            }

            const exhibition = await ExhibitionModel.findById(id)
                .populate({
                    path: 'author',
                    select: 'name email image',
                    model: 'User'
                })
                .populate('gallery')
                .populate({
                    path: 'artworkPositions.artwork',
                    model: 'Artwork'
                });

            if (!exhibition) {
                throw new NotFoundException('Exhibition not found', ErrorCode.NOT_FOUND);
            }
            return exhibition;
        } catch (error) {
            logger.error('Error finding exhibition by ID:', error);
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Error finding exhibition by ID',
                ErrorCode.DATABASE_ERROR
            );
        }
    }


async findAll(options: ExhibitionQueryOptions = {}): Promise<PaginatedExhibitionResponse> {
    try {
        const {
            page = 1,
            limit = 10,
            sort = { startDate: 1 },
            filter = {},
            search = '',
            userId
        } = options;

        // Build the base query with provided filters
        const query: Record<string, any> = { ...filter };
        
        // For public requests, only show exhibitions with discovery=true
        // if they aren't explicitly filtering on discovery
        if (filter.status === ExhibitionStatus.PUBLISHED && !('discovery' in filter)) {
            query.discovery = true;
        }
        
        // Enhanced search to include tags
        if (search) {
            query.$or = [
                { 'contents.name': { $regex: search, $options: 'i' } },
                { 'contents.description': { $regex: search, $options: 'i' } },
                { 'linkName': { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by user ID if provided
        if (userId) {
            query.author = new Types.ObjectId(userId);
        }

        // Determine if we should use projection and lean for better performance
        const isPublicQuery = filter.status === ExhibitionStatus.PUBLISHED;
        
        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Use projection for better performance on public queries
        const projection = isPublicQuery ? {
            'contents.name': 1,
            'contents.description': 1, 
            'contents.category': 1,
            'linkName': 1,
            'status': 1,
            'startDate': 1,
            'endDate': 1,
            'ticket': 1,
            'isFeatured': 1,
            'discovery': 1,
            'author': 1,
            'coverImage': 1,
            'createdAt': 1,
            'updatedAt': 1
        } : undefined;

        // Execute queries in parallel for better performance
        const [exhibitions, total] = await Promise.all([
            ExhibitionModel.find(query, projection)
                .populate({
                    path: 'author',
                    select: 'name email image',
                    model: 'User'
                })
                .sort(sort)
                .skip(skip)
                .limit(limit),
            ExhibitionModel.countDocuments(query)
        ]);

        // Calculate pagination info
        const pages = Math.ceil(total / limit);
        
        return {
            exhibitions,
            pagination: {
                total,
                page,
                limit,
                pages,
                hasNext: page < pages,
                hasPrev: page > 1
            }
        };

    } catch (error) {
        logger.error('Error retrieving exhibitions:', error);
        throw new InternalServerErrorException(
            'Error retrieving exhibitions',
            ErrorCode.DATABASE_ERROR
        );
    }
}

    async update(id: string, data: UpdateExhibitionDto): Promise<ExhibitionDocument | null> {
        try {
            if (!Types.ObjectId.isValid(id)) {
                throw new BadRequestException('Invalid exhibition ID format');
            }

            // validate linkName uniqueness
            if (data.linkName) {

                const existingExhibitionWithLinkName = await ExhibitionModel.findOne({ linkName: data.linkName });
                if (existingExhibitionWithLinkName && existingExhibitionWithLinkName.id !== id) {
                    throw new BadRequestException('Link name has been used', ErrorCode.LINKNAME_EXISTS);
                }
            }

            // First find the existing exhibition
            const existingExhibition = await ExhibitionModel.findById(id);
            if (!existingExhibition) {
                throw new NotFoundException('Exhibition not found');
            }

            // Use factory to update exhibition object
            const updatedExhibitionData = ExhibitionFactory.update(
                existingExhibition.toObject(),
                data as Partial<Exhibition>
            );

            // Update the exhibition with our constructed object
            const exhibition = await ExhibitionModel.findByIdAndUpdate(
                id,
                { $set: updatedExhibitionData },
                { new: true, runValidators: true }
            )
                .populate({
                    path: 'author',
                    select: 'name email image',
                    model: 'User'
                })
                .populate('gallery')
                .populate({
                    path: 'artworkPositions.artwork',
                    model: 'Artwork'
                });

            return exhibition;
        } catch (error) {
            // logger.error(`Error updating exhibition ${id}:`, error);
            if (error instanceof Error.ValidationError) {
                throw new BadRequestException(
                    'Invalid exhibition data',
                    ErrorCode.VALIDATION_ERROR,
                    error.errors
                );
            }
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Error updating exhibition',
                ErrorCode.DATABASE_ERROR
            );
        }
    }

    async delete(id: string): Promise<ExhibitionDocument | null> {
        try {
            if (!Types.ObjectId.isValid(id)) {
                throw new BadRequestException('Invalid exhibition ID format');
            }

            const exhibition = await ExhibitionModel.findByIdAndDelete(id);
            if (!exhibition) {
                throw new NotFoundException('Exhibition not found');
            }

            return exhibition;
        } catch (error) {
            logger.error(`Error deleting exhibition ${id}:`, error);
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Error deleting exhibition',
                ErrorCode.DATABASE_ERROR
            );
        }
    }


    async findByLinkName(linkName: string): Promise<ExhibitionDocument | null> {
        try {
            if (!linkName || typeof linkName !== 'string') {
                throw new BadRequestException('Invalid link name format');
            }

            const exhibition = await ExhibitionModel.findOne({ linkName })
                .populate({
                    path: 'author',
                    select: 'name email image',
                    model: 'User'
                })
                .populate('gallery')
                .populate({
                    path: 'artworkPositions.artwork',
                    model: 'Artwork'
                });

            if (!exhibition) {
                throw new NotFoundException('Exhibition not found', ErrorCode.NOT_FOUND);
            }
            return exhibition;
        } catch (error) {
            logger.error('Error finding exhibition by link name:', error);
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Error finding exhibition by link name',
                ErrorCode.DATABASE_ERROR
            );
        }
    }

    async approveExhibition(id: string): Promise<ExhibitionDocument> {
        try {
            if (!Types.ObjectId.isValid(id)) {
                throw new BadRequestException('Invalid exhibition ID format');
            }

            const exhibition = await ExhibitionModel.findById(id);
            if (!exhibition) {
                throw new NotFoundException('Exhibition not found');
            }

            if (exhibition.status !== ExhibitionStatus.PENDING) {
                throw new BadRequestException('Exhibition is not in pending status');
            }

            exhibition.status = ExhibitionStatus.PUBLISHED;
            await exhibition.save();



            await NotificationService.createNotification({
                title: 'Exhibition Approved',
                content: `Your exhibition "${exhibition._id}" has been approved.`,
                userId: exhibition.author.toString()
            });

            return exhibition;
        } catch (error) {
            logger.error(`Error approving exhibition ${id}:`, error);
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Error approving exhibition',
                ErrorCode.DATABASE_ERROR
            );
        }
    }

    async rejectExhibition(id: string, reason: string): Promise<ExhibitionDocument> {
        try {
            if (!Types.ObjectId.isValid(id)) {
                throw new BadRequestException('Invalid exhibition ID format');
            }

            const exhibition = await ExhibitionModel.findById(id);
            if (!exhibition) {
                throw new NotFoundException('Exhibition not found');
            }

            if (exhibition.status !== ExhibitionStatus.PENDING) {
                throw new BadRequestException('Exhibition is not in pending status');
            }

            exhibition.status = ExhibitionStatus.REJECTED;
            // You might want to add a rejectionReason field to your Exhibition model
            // exhibition.rejectionReason = reason;
            await exhibition.save();

            // Notify the user about the rejection
            await NotificationService.createNotification({

                title: 'Exhibition Rejected',
                content: `Your exhibition "${exhibition._id}" has been rejected. Reason: ${reason}`,
                userId: exhibition.author.toString()
            });

            return exhibition;
        } catch (error) {
            logger.error(`Error rejecting exhibition ${id}:`, error);
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Error rejecting exhibition',
                ErrorCode.DATABASE_ERROR
            );
        }
    }

    async purchaseTicket(exhibitionId: string, userId: string): Promise<TicketPurchaseResponse> {
        try {
            const exhibition = await ExhibitionModel.findById(exhibitionId);
            if (!exhibition) {
                throw new NotFoundException('Exhibition not found', ErrorCode.NOT_FOUND);
            }

            if (!exhibition.ticket) {
                throw new BadRequestException('This exhibition does not have ticket configuration', ErrorCode.TICKET_NOT_CONFIGURED);
            }


            if (exhibition.author.toString() === userId) {
                throw new BadRequestException(
                    'You cannot purchase a ticket for your own exhibition',
                    ErrorCode.INVALID_OPERATION
                );
            }

            // Check if user already has a ticket
            if (exhibition.ticket.registeredUsers.includes(new Types.ObjectId(userId))) {
                throw new BadRequestException('You already have a ticket for this exhibition', ErrorCode.TICKET_ALREADY_PURCHASED);
            }

            // If ticket requires payment, process it through wallet
            if (exhibition.ticket.requiresPayment && exhibition.ticket.price > 0) {
                // Check user's wallet balance first
                const userWallet = await Wallet.findOne({ userId });
                if (!userWallet) {
                    throw new BadRequestException('User wallet not found', ErrorCode.WALLET_NOT_FOUND);
                }

                // Check if user has enough balance
                if (userWallet.balance < exhibition.ticket.price) {
                    throw new BadRequestException(
                        `Insufficient balance. Required: ${exhibition.ticket.price}, Available: ${userWallet.balance}`,
                        ErrorCode.INSUFFICIENT_BALANCE
                    );
                }

                // Process payment using wallet
                const paymentResult = await this._walletService.payment(
                    userId,
                    exhibition.ticket.price,
                    `Ticket purchase for exhibition: ${exhibition.contents[0]?.name || exhibitionId}`
                );

                if (paymentResult.status === 'FAILED') {
                    throw new BadRequestException(paymentResult.message, ErrorCode.PAYMENT_CREATION_FAILED);
                }

                // If the exhibition has an artist, transfer funds to their wallet
                if (exhibition.author) {
                    // Calculate commission (e.g., 3%)
                    const commissionRate = 0.03;
                    const commissionAmount = exhibition.ticket.price * commissionRate;
                    const artistAmount = exhibition.ticket.price - commissionAmount;

                    // Add funds to artist wallet
                    let artistWallet = await Wallet.findOne({ userId: exhibition.author });
                    if (!artistWallet) {
                        artistWallet = await Wallet.create({
                            userId: exhibition.author,
                            balance: 0
                        });
                    }

                    await this._walletService.addFunds(artistWallet._id.toString(), artistAmount, {
                        userId: exhibition.author.toString(),
                        type: 'TICKET_SALE',
                        description: `Ticket sale for exhibition: ${exhibition.contents[0]?.name || exhibitionId}`,
                        status: 'PAID'
                    });
                }
            }

            // Add user to registered users
            exhibition.ticket.registeredUsers.push(new Types.ObjectId(userId));
            await exhibition.save();

            // Send notification to user
            await NotificationService.createNotification({
                title: 'Ticket Purchased',
                content: `You have successfully purchased a ticket for exhibition: ${exhibition.contents[0]?.name || exhibitionId}`,
                userId: userId
            });

            return {
                exhibitionId: exhibition._id.toString(),
                exhibitionName: exhibition.contents[0]?.name || 'Untitled Exhibition',
                purchaseDate: new Date(),
                price: exhibition.ticket.price || 0,
                status: 'COMPLETED'
            };
        } catch (error) {
            console.error(`Error purchasing ticket for exhibition ${exhibitionId}:`, error);
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Error purchasing ticket',
                ErrorCode.TRANSACTION_FAILED
            );
        }
    }

    public async findPublishedById(id: string): Promise<ExhibitionDocument | null> {
        try {
            // Validate ID format
            if (!Types.ObjectId.isValid(id)) {
                throw new BadRequestException('Invalid exhibition ID format');
            }
    
            // Find exhibition with populated fields
            const exhibition = await ExhibitionModel.findOne({
                _id: id,
                status: ExhibitionStatus.PUBLISHED
            })
            .populate({
                path: 'author',
                select: 'name email image',
                model: 'User'
            })
            .populate('gallery')
            .populate({
                path: 'artworkPositions.artwork',
                model: 'Artwork'
            });
    
            if (!exhibition) {
                throw new NotFoundException('Exhibition not found', ErrorCode.NOT_FOUND);
            }
    
            return exhibition;
        } catch (error) {
            logger.error('Error finding published exhibition by ID:', error);
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Error finding published exhibition',
                ErrorCode.DATABASE_ERROR
            );
        }
    }
    
    public async findPublishedByLinkName(linkName: string): Promise<ExhibitionDocument | null> {
        try {
            // Validate linkName
            if (!linkName || typeof linkName !== 'string') {
                throw new BadRequestException('Invalid link name format');
            }
    
            // Find exhibition with populated fields
            const exhibition = await ExhibitionModel.findOne({
                linkName,
                status: ExhibitionStatus.PUBLISHED
            })
            .populate({
                path: 'author',
                select: 'name email image',
                model: 'User'
            })
            .populate('gallery')
            .populate({
                path: 'artworkPositions.artwork',
                model: 'Artwork'
            });
    
            if (!exhibition) {
                throw new NotFoundException('Exhibition not found', ErrorCode.NOT_FOUND);
            }
    
            return exhibition;
        } catch (error) {
            logger.error('Error finding published exhibition by link name:', error);
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Error finding published exhibition',
                ErrorCode.DATABASE_ERROR
            );
        }
    }
}