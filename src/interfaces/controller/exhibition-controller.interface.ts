import { Request, Response, NextFunction } from 'express';

export interface IExhibitionController {
  create(req: Request, res: Response, next: NextFunction): Promise<any>;
  findAll(req: Request, res: Response, next: NextFunction): Promise<any>;
  findById(req: Request, res: Response, next: NextFunction): Promise<void>;
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
  delete(req: Request, res: Response, next: NextFunction): Promise<void>;
}