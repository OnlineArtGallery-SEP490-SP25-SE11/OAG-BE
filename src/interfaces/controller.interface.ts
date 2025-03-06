/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from "express";

export interface IBlogTagController {
  createTag(req: Request, res: Response, next: NextFunction): Promise<any>;
  getTags(req: Request, res: Response, next: NextFunction): Promise<any>;
  deleteTag(req: Request, res: Response, next: NextFunction): Promise<any>;
}

export interface IBlogController {
  findAll(req: Request, res: Response, next: NextFunction): Promise<any>;
  findById(req: Request, res: Response, next: NextFunction): Promise<any>;
  findLastEditedByUser(req: Request, res: Response, next: NextFunction): Promise<any>;
  findPublished(req: Request, res: Response, next: NextFunction): Promise<any>;
  create(req: Request, res: Response, next: NextFunction): Promise<any>;
  update(req: Request, res: Response, next: NextFunction): Promise<any>;
  delete(req: Request, res: Response, next: NextFunction): Promise<any>;
  approve(req: Request, res: Response, next: NextFunction): Promise<any>;
  reject(req: Request, res: Response, next: NextFunction): Promise<any>;
  requestPublish(req: Request, res: Response, next: NextFunction): Promise<any>;
  findUserBlogs(req: Request, res: Response, next: NextFunction): Promise<any>;
  find(req: Request, res: Response, next: NextFunction): Promise<any>;
}

export interface IInteractionController {
	getUserInteractions(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any>;
}
