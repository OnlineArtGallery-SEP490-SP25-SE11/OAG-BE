import { NextFunction, Request, Response } from 'express';
/* eslint-disable no-unused-vars */

export interface IGalleryController {
    create(req: Request, res: Response, next: NextFunction): Promise<any>;
    findAll(req: Request, res: Response, next: NextFunction): Promise<any>;
    findById(req: Request, res: Response, next: NextFunction): Promise<any>;
    update(req: Request, res: Response, next: NextFunction): Promise<any>;
    delete(req: Request, res: Response, next: NextFunction): Promise<any>;
}
