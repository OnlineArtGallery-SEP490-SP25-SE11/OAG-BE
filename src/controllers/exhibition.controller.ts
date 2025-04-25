import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { BaseHttpResponse } from '@/lib/base-http-response';
import { TYPES } from '@/constants/types';
import { IExhibitionController } from '@/interfaces/controller/exhibition-controller.interface';
import { ExhibitionService } from '@/services/exhibition.service';
import { ExhibitionStatus } from '@/constants/enum';
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
    this.updateAnalytics = this.updateAnalytics.bind(this);
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
      const {
        page,
        limit,
        sort,
        filter,
        search
      } = req.query;

      // Force status to be PUBLISHED regardless of what was passed in the request
      const statusParam: ExhibitionStatus = ExhibitionStatus.PUBLISHED;

      const options = {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        sort: sort ? JSON.parse(sort as string) : { createdAt: -1 },
        filter: {
          ...filter ? JSON.parse(filter as string) : {},
          discovery: true // Force discovery to be true
        },
        status: statusParam,
        search: search as string
      };

      const result = await this._exhibitionService.findAll(options);

      const response = BaseHttpResponse.success(
        result,
        200,
        'Published exhibitions retrieved successfully'
      );
      res.status(response.statusCode).json(response);
    } catch (error) {
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

  likeArtwork = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: exhibitionId } = req.params;
      const { artworkId } = req.validatedData;
      const userId = req.userId!;

      const result = await this._exhibitionService.toggleArtworkLike(
        exhibitionId,
        artworkId,
        userId
      );

      const response = BaseHttpResponse.success(
        result,
        200,
        result.liked ? 'Artwork liked successfully' : 'Artwork unliked successfully'
      );
      
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

    updateAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('Update Analytics:', req.validatedData);
      const exhibition = await this._exhibitionService.updateAnalytics(
        req.params.id,
        req.validatedData
      );

      const response = BaseHttpResponse.success(
        { exhibition },
        200,
        'Exhibition analytics updated successfully'
      );
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };
}