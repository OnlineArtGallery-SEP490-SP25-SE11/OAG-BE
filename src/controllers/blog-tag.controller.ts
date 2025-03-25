import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/constants/types';
import { BlogTagService } from '@/services/blog-tag.service';
import { BaseHttpResponse } from '@/lib/base-http-response';
import { BadRequestException } from '@/exceptions/http-exception';

@injectable()
export class BlogTagController {
    constructor(
        @inject(TYPES.BlogTagService) private readonly _blogTagService: BlogTagService
    ) {}

    createTag = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { name } = req.body;
            if (!name) {
                throw new BadRequestException('Tag name is required');
            }
            const tag = await this._blogTagService.createTag(name);
            const response = BaseHttpResponse.success(
                tag,
                201,
                'Create tag success'
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    };

    getTags = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const tags = await this._blogTagService.getTags();
            const response = BaseHttpResponse.success(
                tags,
                200,
                'Get tags success'
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    };

    deleteTag = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { id } = req.params;
            await this._blogTagService.deleteTag(id);
            const response = BaseHttpResponse.success(
                null,
                204,
                'Delete tag success'
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    };
}