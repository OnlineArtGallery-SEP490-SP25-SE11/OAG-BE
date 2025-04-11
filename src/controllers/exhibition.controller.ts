import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { BaseHttpResponse } from '@/lib/base-http-response';
import { TYPES } from '@/constants/types';
import { IExhibitionController } from '@/interfaces/controller/exhibition-controller.interface';
import { ExhibitionService } from '@/services/exhibition.service';
import { ExhibitionStatus } from '@/constants/enum';
import logger from '@/configs/logger.config';
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
    this.findUserExhibitions = this.findUserExhibitions.bind(this);
    this.approveExhibition = this.approveExhibition.bind(this);
    this.rejectExhibition = this.rejectExhibition.bind(this);
    this.purchaseTicket = this.purchaseTicket.bind(this);
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const exhibition = await this._exhibitionService.create({
        gallery: req.validatedData.gallery,
        author: req.userId!,
      });
      // TODO: check if gallery is premium model, then check is artist is premium

      const response = BaseHttpResponse.success(
        { exhibition },
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
        status,
        search
      } = req.query;
      let statusParam: ExhibitionStatus | ExhibitionStatus[] | undefined = undefined;
      if (status) {
        if (typeof status === 'string' && status.includes(',')) {
          statusParam = status.split(',') as ExhibitionStatus[];
        } else {
          statusParam = status as ExhibitionStatus;
        }
      }
      const options = {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        sort: sort ? JSON.parse(sort as string) : { createdAt: -1 },
        filter: filter ? JSON.parse(filter as string) : {},
        status: statusParam,
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
        { exhibition },
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
        { exhibition },
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

  findUserExhibitions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exhibitions = await this._exhibitionService.findAll({
        userId: req.userId
      });

      const response = BaseHttpResponse.success(
        exhibitions,
        200,
        'User exhibitions retrieved successfully'
      );
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

  approveExhibition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exhibition = await this._exhibitionService.approveExhibition(req.params.id);

      const response = BaseHttpResponse.success(
        { exhibition },
        200,
        'Exhibition approved successfully'
      );
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

  rejectExhibition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exhibition = await this._exhibitionService.rejectExhibition(
        req.params.id,
        req.body.reason
      );

      const response = BaseHttpResponse.success(
        { exhibition },
        200,
        'Exhibition rejected successfully'
      );
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

  async purchaseTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exhibition = await this._exhibitionService.purchaseTicket(
        req.params.id,
        req.userId!
      );

      const response = BaseHttpResponse.success(
        { exhibition },
        200,
        'Ticket purchased successfully'
      );
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  public findPublishedExhibitions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract and validate query parameters with safe defaults
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 50);

      // Parse sort parameter with safe default
      let sort: Record<string, 1 | -1> = { startDate: 1 };
      try {
        if (req.query.sort) {
          const parsedSort = JSON.parse(req.query.sort as string);
          if (typeof parsedSort === 'object' && parsedSort !== null) {
            sort = parsedSort;
          }
        }
      } catch (parseError) {
        logger.warn('Invalid sort parameter provided', { error: parseError });
      }

      // Add published status and discovery flag to filter
      let filter: Record<string, any> = {
        status: ExhibitionStatus.PUBLISHED,
        discovery: true
      };

      // Handle isFeatured parameter
      if (req.query.isFeatured === 'true') {
        filter.isFeatured = true;
      }

      // Parse additional filter parameters if provided
      try {
        if (req.query.filter) {
          const parsedFilter = JSON.parse(req.query.filter as string);
          if (typeof parsedFilter === 'object' && parsedFilter !== null) {
            // Preserve required filters but add user-provided filters
            filter = {
              ...parsedFilter,
            }
          }
        }
      } catch (parseError) {
        logger.warn('Invalid filter parameter provided', { error: parseError });
      }

      const options = {
        page,
        limit,
        sort,
        filter,
        search: req.query.search as string
      };
      console.log('Exhibition options:', options);

      // Set cache headers for better performance
      const cacheTime = req.query.search ? 60 : 300; // 1 min for searches, 5 min for listings
      res.setHeader('Cache-Control', `public, max-age=${cacheTime}`);

      // Use the standard findAll method with the public filter applied
      const result = await this._exhibitionService.findAll(options);

      const response = BaseHttpResponse.success(
        result,
        200,
        'Published exhibitions retrieved successfully'
      );
      res.status(response.statusCode).json(response);
    } catch (error) {
      logger.error('Error retrieving published exhibitions:', error);
      next(error);
    }
  };

  public findPublishedExhibitionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exhibition = await this._exhibitionService.findPublishedById(req.params.id);

      const response = BaseHttpResponse.success(
        { exhibition },
        200,
        'Published exhibition retrieved successfully'
      );
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

  public findPublishedExhibitionByLinkName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exhibition = await this._exhibitionService.findPublishedByLinkName(req.params.linkName);

      const response = BaseHttpResponse.success(
        { exhibition },
        200,
        'Published exhibition retrieved successfully'
      );
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

}