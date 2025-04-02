import { injectable } from 'inversify';
import { Error, Types } from 'mongoose';
import ExhibitionModel, { ExhibitionDocument, Exhibition } from '@/models/exhibition.model';
import logger from '@/configs/logger.config';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@/exceptions/http-exception';
import { ErrorCode } from '@/constants/error-code';
import { CreateEmptyExhibitionDto, UpdateExhibitionDto } from '@/dto/exhibition.dto';
import { IExhibitionService, ExhibitionQueryOptions, PaginatedExhibitionResponse } from '@/interfaces/service/exhibition-service.interface';
import { ExhibitionFactory } from '@/factorires/exhitition.factory';
import { GalleryModel } from '@/models/gallery.model';

@injectable()
export class ExhibitionService implements IExhibitionService {
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
                search = ''
            } = options;

            const query: Record<string, any> = { ...filter };
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;
            const [exhibitions, total] = await Promise.all([
                ExhibitionModel.find(query)
                    .populate({
                        path: 'author',
                        select: 'name email image',
                        model: 'User'
                    })
                    .populate('gallery')
                    .populate({
                        path: 'artworkPositions.artwork',
                        model: 'Artwork'
                    })
                    .sort(sort)
                    .skip(skip)
                    .limit(limit),
                ExhibitionModel.countDocuments(query)
            ]);

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
                    throw new BadRequestException('Link name has been used', ErrorCode.VALIDATION_ERROR);
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
            logger.error(`Error updating exhibition ${id}:`, error);
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
    
}