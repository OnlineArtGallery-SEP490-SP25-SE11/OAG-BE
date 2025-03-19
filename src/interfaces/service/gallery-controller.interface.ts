import { NextFunction } from "express";

export interface IGalleryController {
    create(req: Request, res: Response, next: NextFunction): Promise<any>;
    findAll(req: Request, res: Response, next: NextFunction): Promise<any>;
    findById(req: Request, res: Response, next: NextFunction): Promise<any>;
    update(req: Request, res: Response, next: NextFunction): Promise<any>;
    delete(req: Request, res: Response, next: NextFunction): Promise<any>;
}
