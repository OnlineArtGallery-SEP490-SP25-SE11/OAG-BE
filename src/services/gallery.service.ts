import { injectable } from 'inversify';
import { Error, Types } from 'mongoose';
import GalleryModel, { GalleryDocument } from '@/models/gallery.model';
import logger from '@/configs/logger.config';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@/exceptions/http-exception';
import { ErrorCode } from '@/constants/error-code';
import { CreateGalleryDto, UpdateGalleryDto } from '@/dto/gallery.dto';
import { IGalleryService } from '@/interfaces/service/gallery-service.interface';

interface GalleryQueryOptions {
    page?: number;
    limit?: number;
    sort?: Record<string, any>;
    filter?: Record<string, any>;
    search?: string;
}

interface PaginatedGalleryResponse {
    galleries: GalleryDocument[];
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
export class GalleryService implements IGalleryService {
    async create(data: CreateGalleryDto): Promise<GalleryDocument> {
        try {
            // Check if gallery with same name already exists
            const existingGallery = await GalleryModel.findOne({
                name: {
                    $regex: new RegExp(`^${data.name}$`, 'i') // Case insensitive match
                }
            });

            if (existingGallery) {
                throw new BadRequestException(
                    'Gallery with this name already exists',
                    ErrorCode.GALLERY_NAME_EXISTS
                );
            }

            // Create new gallery if name is unique
            const gallery = await GalleryModel.create(data);
            return gallery;

        } catch (error) {
            logger.error('Error creating gallery:', error);

            if (error instanceof BadRequestException) {
                throw error;
            }

            if (error instanceof Error.ValidationError) {
                throw new BadRequestException(
                    'Invalid gallery data',
                    ErrorCode.VALIDATION_ERROR,
                    error.errors
                );
            }

            throw new InternalServerErrorException(
                'Error creating gallery',
                ErrorCode.DATABASE_ERROR
            );
        }
    }


    async findById(id: string): Promise<GalleryDocument | null> {
        try {
            if (!Types.ObjectId.isValid(id)) {
                throw new BadRequestException('Invalid gallery ID format');
            }

            const gallery = await GalleryModel.findById(id);
            if (!gallery) {
                throw new NotFoundException('Gallery not found');
            }

            return gallery;
        } catch (error) {
            logger.error(`Error finding gallery by id ${id}:`, error);
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Error retrieving gallery',
                ErrorCode.DATABASE_ERROR
            );
        }
    }

    async findAll(options: GalleryQueryOptions = {}): Promise<PaginatedGalleryResponse> {
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
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            // Calculate pagination
            const skip = (page - 1) * limit;

            // Execute query
            const [galleries, total] = await Promise.all([
                GalleryModel.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit),
                GalleryModel.countDocuments(query)
            ]);

            const pages = Math.ceil(total / limit);

            return {
                galleries,
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
            logger.error('Error retrieving galleries:', error);
            throw new InternalServerErrorException(
                'Error retrieving galleries',
                ErrorCode.DATABASE_ERROR
            );
        }
    }

    async update(id: string, data: UpdateGalleryDto): Promise<GalleryDocument | null> {
        try {
            if (!Types.ObjectId.isValid(id)) {
                throw new BadRequestException('Invalid gallery ID format');
            }

            const gallery = await GalleryModel.findByIdAndUpdate(
                id,
                { $set: data },
                { new: true, runValidators: true }
            );

            if (!gallery) {
                throw new NotFoundException('Gallery not found');
            }

            return gallery;
        } catch (error) {
            logger.error(`Error updating gallery ${id}:`, error);
            if (error instanceof Error.ValidationError) {
                throw new BadRequestException(
                    'Invalid gallery data',
                    ErrorCode.VALIDATION_ERROR,
                    error.errors
                );
            }
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Error updating gallery',
                ErrorCode.DATABASE_ERROR
            );
        }
    }

    async delete(id: string): Promise<GalleryDocument | null> {
        try {
            if (!Types.ObjectId.isValid(id)) {
                throw new BadRequestException('Invalid gallery ID format');
            }

            const gallery = await GalleryModel.findByIdAndDelete(id);
            if (!gallery) {
                throw new NotFoundException('Gallery not found');
            }

            return gallery;
        } catch (error) {
            logger.error(`Error deleting gallery ${id}:`, error);
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Error deleting gallery',
                ErrorCode.DATABASE_ERROR
            );
        }
    }


}
