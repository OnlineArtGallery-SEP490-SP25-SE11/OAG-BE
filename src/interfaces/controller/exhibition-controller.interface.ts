import { Request, Response, NextFunction } from 'express';

export interface IExhibitionController {
  create(req: Request, res: Response, next: NextFunction): Promise<any>;
  findAll(req: Request, res: Response, next: NextFunction): Promise<any>;
  findById(req: Request, res: Response, next: NextFunction): Promise<void>;
  findByLinkName(req: Request, res: Response, next: NextFunction): Promise<void>;
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
  delete(req: Request, res: Response, next: NextFunction): Promise<void>;
  findUserExhibitions(req: Request, res: Response, next: NextFunction): Promise<void>;
  approveExhibition(req: Request, res: Response, next: NextFunction): Promise<void>;
  rejectExhibition(req: Request, res: Response, next: NextFunction): Promise<void>;
  purchaseTicket(req: Request, res: Response, next: NextFunction): Promise<void>;
  findPublishedExhibitions(req: Request, res: Response, next: NextFunction): Promise<void>;
  findPublishedExhibitionById(req: Request, res: Response, next: NextFunction): Promise<void>;
  findPublishedExhibitionByLinkName(req: Request, res: Response, next: NextFunction): Promise<void>;
  likeArtwork(req: Request, res: Response, next: NextFunction): Promise<void>;
}