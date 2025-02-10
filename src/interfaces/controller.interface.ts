/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from 'express';

export interface IBlogController {
	getBlogs(req: Request, res: Response, next: NextFunction): Promise<any>;
	getBlogById(req: Request, res: Response, next: NextFunction): Promise<any>;
	createBlog(req: Request, res: Response, next: NextFunction): Promise<any>;
	updateBlog(req: Request, res: Response, next: NextFunction): Promise<any>;
	deleteBlog(req: Request, res: Response, next: NextFunction): Promise<any>;
	getLastEditedBlog(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any>;
	getPublishedBlogs(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any>;
}

export interface IInteractionController {
	getUserInteractions(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any>;
}
