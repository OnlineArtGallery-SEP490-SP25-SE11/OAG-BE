import { injectable } from "inversify";
import BlogTagModel, { BlogTag } from "@/models/blog-tag.model";
import logger from '@/configs/logger.config';
import { ErrorCode } from '@/constants/error-code';
import { InternalServerErrorException } from "@/exceptions/http-exception";
import { IBlogTagService } from "@/interfaces/service.interface";

@injectable()
export class BlogTagService implements IBlogTagService{
    constructor() {}

    async createTag(name: string): Promise<BlogTag> {
        try {
            //find if tag existed
            const existedTag = await BlogTagModel.findOne({ name });
            
            if (existedTag) {
                return existedTag;
            }

            const tag = new BlogTagModel({ name });
            return await tag.save();
        } catch (error) {
            logger.error(error, 'Error creating blog tag');
            throw new InternalServerErrorException(
                'Error creating blog tag',
                ErrorCode.DATABASE_ERROR
            );
        }
    }

    async getTags(): Promise<BlogTag[]> {
        try {
            return await BlogTagModel.find({}, 'name _id')
                .lean()
                .exec();
        } catch (error) {
            logger.error(error, 'Error getting blog tags');
            throw new InternalServerErrorException(
                'Error getting blog tags',
                ErrorCode.DATABASE_ERROR
            );
        }
    }

    async deleteTag(id: string): Promise<void> {
        try {
            await BlogTagModel.findByIdAndDelete(id);
        } catch (error) {
            logger.error(error, 'Error deleting blog tag');
            throw new InternalServerErrorException(
                'Error deleting blog tag',
                ErrorCode.DATABASE_ERROR
            );
        }
    }
}