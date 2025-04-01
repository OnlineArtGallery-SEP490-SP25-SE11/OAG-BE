import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { BaseHttpResponse } from '@/lib/base-http-response';
import { TYPES } from '@/constants/types';
import { IExhibitionController } from '@/interfaces/controller/exhibition-controller.interface';
import { ExhibitionService } from '@/services/exhibition.service';
@injectable()
export class ExhibitionController implements IExhibitionController {
  constructor(
    @inject(TYPES.ExhibitionService) private readonly _exhibitionService: ExhibitionService
  ) {
    this.create = this.create.bind(this);
    this.findAll = this.findAll.bind(this);
    this.findById = this.findById.bind(this);
    this.findByLinkName = this.findByLinkName.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }       

  create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const exhibition = await this._exhibitionService.create({
        gallery: req.validatedData.gallery,
        author: req.userId!,
      });
      // TODO: check if gallery is premium model, then check is artist is premium
      
      const response = BaseHttpResponse.success(
        exhibition,
        201,
        'Exhibition created successfully'
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

      const result = await this._exhibitionService.findAll(options);
      
      const response = BaseHttpResponse.success(
        result,
        200,
        'Exhibitions retrieved successfully'
      );
      return res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exhibition = await this._exhibitionService.update(
        req.params.id,
        req.validatedData || req.body
      );
      
      const response = BaseHttpResponse.success(
        {exhibition},
        200,
        'Exhibition updated successfully'
      );
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this._exhibitionService.delete(req.params.id);
      
      const response = BaseHttpResponse.success(
        null,
        200,
        'Exhibition deleted successfully'
      );
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exhibition = await this._exhibitionService.findById(req.params.id);
      
      const response = BaseHttpResponse.success(
        {exhibition},
        200,
        'Exhibition retrieved successfully'
      );
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  
  findByLinkName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { linkName } = req.params;
      const exhibition = await this._exhibitionService.findByLinkName(linkName);
      
      const response = BaseHttpResponse.success(
        { exhibition },
        200,
        'Exhibition retrieved successfully'
      );
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };
}