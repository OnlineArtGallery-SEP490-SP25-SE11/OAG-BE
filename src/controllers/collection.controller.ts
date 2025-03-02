import { inject, injectable } from 'inversify';
import { TYPES } from '@/constants/types.ts';
import { NextFunction, Request, Response } from 'express';
import { BaseHttpResponse } from '@/lib/base-http-response.ts';
import { CollectionService } from '@/services/collection.service.ts';

@injectable()
export class CollectionController {
	constructor(
		@inject(TYPES.CollectionService)
		private readonly _collectionService: CollectionService
	) {
		this.add = this.add.bind(this);
		this.update = this.update.bind(this);
		this.get = this.get.bind(this);
	}

	async add(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const { title, description, artworks } = req.body;
			const collection = await this._collectionService.add(
				title,
				description,
				artworks
			);
			const response = BaseHttpResponse.success(
				collection,
				201,
				'Add collection success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}

	async get(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const { id } = req.query;
			const collection = await this._collectionService.get(id as string);
			const response = BaseHttpResponse.success(
				collection,
				200,
				'Get collection success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}

	async update(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const { id, title, description, artworks } = req.body;
			const collection = await this._collectionService.update({
				id,
				title,
				description,
				artworks
			});
			const response = BaseHttpResponse.success(
				collection,
				200,
				'Update collection success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}
}
