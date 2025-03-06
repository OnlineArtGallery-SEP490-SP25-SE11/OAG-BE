import { TYPES } from '@/constants/types';
import { BaseHttpResponse } from '@/lib/base-http-response';
import { ArtworkService } from '@/services/artwork.service';
import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';

@injectable()
export class ArtworkController {
	constructor(
		@inject(TYPES.ArtworkService)
		private readonly _artworkService: ArtworkService
	) {
		this.get = this.get.bind(this);
		this.add = this.add.bind(this);
		this.getById = this.getById.bind(this);
		this.update = this.update.bind(this);
		this.delete = this.delete.bind(this);
	}

	async add(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const {
				title,
				description,
				category,
				dimensions,
				url,
				status,
				price
			} = req.body;
			const artistId = req.userId;
			// valid artistId
			if (!artistId) {
				const errorMessage = 'Invalid artist id';
				throw new Error(errorMessage);
			}
			const artwork = await this._artworkService.add(
				title,
				description,
				artistId,
				category,
				dimensions,
				url,
				status,
				price
			);
			const response = BaseHttpResponse.success(
				artwork,
				201,
				'Add artwork success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}

	async get(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const options = req.query;
			// Loại bỏ skip và take khỏi options
			const { skip: _skip, take: _take, ...queryOptions } = options;
			// tránh cảnh báo eslint
			void _skip;
			void _take;

			const skip = parseInt(req.query.skip as string);
			const take = parseInt(req.query.take as string);

			const { artworks, total } = await this._artworkService.get(
				queryOptions,
				skip,
				take
			);

			const response = BaseHttpResponse.success(
				{
					artworks,
					total
				},
				200,
				'Get artwork success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}

	async getById(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const { id } = req.params;
			const artwork = await this._artworkService.getById(id);
			const response = BaseHttpResponse.success(
				artwork,
				200,
				'Get artwork by id success'
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
			const { id } = req.params;
			const { title, description, category, status, price } = req.body;
			const artistId = req.userId;
			// valid artistId
			if (!artistId) {
				const errorMessage = 'Invalid artist id';
				throw new Error(errorMessage);
			}
			const artwork = await this._artworkService.update(
				{
					title,
					description,
					category,
					status,
					price
				},
				id,
				artistId
			);
			const response = BaseHttpResponse.success(
				artwork,
				200,
				'Update artwork success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}

	async delete(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const { id } = req.params;
			const artistId = req.userId;
			// valid artistId
			if (!artistId) {
				const errorMessage = 'Invalid artist id';
				throw new Error(errorMessage);
			}

			const isDeleted = await this._artworkService.delete(id, artistId);
			const response = BaseHttpResponse.success(
				isDeleted,
				200,
				'Delete artwork success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}
}
