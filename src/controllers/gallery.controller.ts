import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { BaseHttpResponse } from '@/lib/base-http-response';
import { TYPES } from '@/constants/types';
import { IGalleryController } from '@/interfaces/controller/gallery-controller.interface';
import { GalleryService } from '@/services/gallery.service';

@injectable()
export class GalleryController implements IGalleryController{
    constructor(
        @inject(TYPES.GalleryService) private readonly _galleryService: GalleryService
    ) {
        this.create = this.create.bind(this);
        this.findAll = this.findAll.bind(this);
        this.findById = this.findById.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
    }       
 
    create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const gallery = await this._galleryService.create(req.body);
            const response = BaseHttpResponse.success(
                gallery,
                201,
                'Create gallery success'
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    };

    findAll = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { 
                page, 
                limit, 
                sort, 
                filter, 
                search 
            } = req.query;

            const options = {
                page: parseInt(page as string) || 1,
                limit: parseInt(limit as string) || 10,
                sort: sort ? JSON.parse(sort as string) : { createdAt: -1 },
                filter: filter ? JSON.parse(filter as string) : {},
                search: search as string
            };

            const result = await this._galleryService.findAll(options);
            
            const response = BaseHttpResponse.success(
                result,
                200,
                'Galleries retrieved successfully'
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const gallery = await this._galleryService.update(
                req.params.id,
                req.validatedData
            );
            
            const response = BaseHttpResponse.success(
                gallery,
                200,
                'Gallery updated successfully'
            );
            res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this._galleryService.delete(req.params.id);
            
            const response = BaseHttpResponse.success(
                null,
                200,
                'Gallery deleted successfully'
            );
            res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    };

    findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const gallery = await this._galleryService.findById(req.params.id);
            
            const response = BaseHttpResponse.success(
                gallery,
                200,
                'Gallery retrieved successfully'
            );
            res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    };
}
