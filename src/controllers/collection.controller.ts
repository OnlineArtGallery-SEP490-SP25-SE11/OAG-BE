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
		this.delArt = this.delArt.bind(this);
		this.delCollection = this.delCollection.bind(this);
	}

	async add(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const { title, description, artworks } = req.body;
			const userId = req.userId;
			if (!userId) {
				throw new Error('User not found');
			}
			const collection = await this._collectionService.add(
				userId,
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

	async getByUserId(req: Request, res: Response, next: NextFunction): Promise<any> {
		try{
			const userId = req.userId;
			if(!userId){
				throw new Error('User not found');
			}
			const collection = await this._collectionService.getByUserId(userId);
			const response = BaseHttpResponse.success(
				collection,
				200,
				'Get collection success'
			);
			return res.status(response.statusCode).json(response);
		}
		catch(error){
			next(error);
		}
	}

	async update(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const { id, artId } = req.body;

			if (!id) {
				throw new Error('Collection not found');
			}

			const updatedCollection = await this._collectionService.update(
				id,
				artId
			);
			const response = BaseHttpResponse.success(
				updatedCollection,
				200,
				'Artwork(s) added to collection successfully'
			);

			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}

	async delArt(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const { id, artId } = req.body;

			if (!id) {
				throw new Error('Collection ID is required');
			}

			if (!artId) {
				throw new Error('Artwork ID is required');
			}

			const updatedCollection = await this._collectionService.delArt(id, artId);
			const response = BaseHttpResponse.success(
				updatedCollection,
				200,
				'Artwork removed from collection successfully'
			);

			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}

	async delCollection(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const { id } = req.params;
			if (!id) {
				throw new Error('Collection ID is required');
			}
			const collection = await this._collectionService.delCollection(id);
			const response = BaseHttpResponse.success(
				collection,
				200,
				'Collection deleted successfully'
			);
			return res.status(response.statusCode).json(response);
		}
		catch (error) {
			next(error)
		}
	}
}
