import logger from '@/configs/logger.config';
import Artwork from '@/models/artwork.model';
import User from '@/models/user.model.ts';
import { inject, injectable } from 'inversify';
import { FilterQuery, Types } from 'mongoose';
import Wallet from '@/models/wallet.model';
import  container  from '@/configs/container.config';
import WalletService from '@/services/wallet.service';
import { TYPES } from '@/constants/types';

export interface ArtworkQueryOptions {
	select?: string;
	title?: string;
	category?: string;
	status?: string;
	description?: string;
	artistName?: string;
}

export interface ArtworkUpdateOptions {
	title?: string;
	description?: string;
	category?: [string];
	status?: string;
	price?: number;
}

@injectable()
export class ArtworkService {
	/**
	 * Thêm artwork mới.
	 */

	constructor(
		@inject(TYPES.WalletService) private walletService: WalletService
	) { }

	async add(
		title: string,
		description: string,
		artistId: string,
		category: [string],
		dimensions: {
			width: number;
			height: number;
		},
		url: string,
		status: string,
		price: number
	): Promise<InstanceType<typeof Artwork>> {
		try {
			// Kiểm tra artistId có hợp lệ không
			if (!Types.ObjectId.isValid(artistId)) {
				const errorMessage = 'Invalid artist id';
				logger.error(errorMessage);
				throw new Error(errorMessage);
			}
			const artwork = new Artwork({
				title,
				description,
				category,
				dimensions,
				url,
				status,
				price,
				artistId
			});
			return await artwork.save();
		} catch (error) {
			logger.error(`Error adding artwork: ${error}`);
			throw error;
		}
	}

	/**
	 * Lấy danh sách artworks theo các điều kiện, hỗ trợ phân trang.
	 */
	async get(
		options: ArtworkQueryOptions,
		skip: number,
		take: number
	): Promise<{
		artworks: InstanceType<typeof Artwork>[];
		total: number;
	}> {
		try {
			// const query: FilterQuery<typeof Artwork> = { ...options };
			const { select, ...rest } = options;
			const query: FilterQuery<typeof Artwork> = { ...rest };
			// Sử dụng regex cho title và description nếu có
			if (options.title) {
				query.title = { $regex: options.title, $options: 'i' };
			}
			if (options.description) {
				query.description = {
					$regex: options.description,
					$options: 'i'
				};
			}

			if (options.artistName) {
				const artistQuery = {
					name: { $regex: options.artistName, $options: 'i' }
				};
				const artistIds = await User.find(artistQuery)
					.select('_id')
					.exec();
				delete query.artistName;
				query.artistId = { $in: artistIds };
				// query.artistId = { $in: artistIds.map((artist) => artist._id) };
			}
			let artworkQuery = Artwork.find(query).sort({ createdAt: -1 });
			if (typeof skip === 'number' && skip >= 0) {
				artworkQuery = artworkQuery.skip(skip);
			}
			if (typeof take === 'number' && take > 0) {
				artworkQuery = artworkQuery.limit(take);
			}
			// if (select) {
			// 	artworkQuery = artworkQuery.select(select);
			// }
			const [artworks, total] = await Promise.all([
				artworkQuery.exec(),
				Artwork.countDocuments(query).exec()
			]);

			return { artworks, total };
		} catch (error) {
			logger.error(
				`Error fetching artworks with options ${JSON.stringify(
					options
				)}: ${error}`
			);
			throw error;
		}
	}

	/**
	 * Lấy artwork theo id.
	 */
	async getById(id: string): Promise<InstanceType<typeof Artwork>> {
		if (!Types.ObjectId.isValid(id)) {
			const errorMessage = 'Invalid artwork id';
			logger.error(errorMessage);
			throw new Error(errorMessage);
		}

		try {
			const artwork = await Artwork.findById(id)
				.populate({
					path: 'artistId',
					select: 'name image',
					model: 'User' // Explicitly specify the model name
				})
				.exec();

			if (!artwork) {
				const errorMessage = 'Artwork not found';
				logger.error(errorMessage);
				throw new Error(errorMessage);
			}
			return artwork;
		} catch (error) {
			logger.error(`Error fetching artwork by id ${id}: ${error}`);
			throw error;
		}
	}

	async update(
		options: ArtworkUpdateOptions,
		id: string,
		artistId: string
	): Promise<InstanceType<typeof Artwork>> {
		try {
			// Kiểm tra id hợp lệ
			if (!Types.ObjectId.isValid(id)) {
				const errorMessage = 'Invalid artwork id';
				logger.error(errorMessage);
				throw new Error(errorMessage);
			}

			// Tìm artwork để xác minh quyền update
			const existingArtwork = await Artwork.findById(id);

			// Kiểm tra artwork có tồn tại không
			if (!existingArtwork) {
				const errorMessage = 'Artwork not found';
				logger.error(errorMessage);
				throw new Error(errorMessage);
			}

			// Kiểm tra xem người update có phải là chủ sở hữu của artwork không
			if (!existingArtwork.artistId) {
				const errorMessage = 'Artwork does not have an artistId';
				logger.error(errorMessage);
				throw new Error(errorMessage);
			}

			if (existingArtwork.artistId.toString() !== artistId) {
				const errorMessage =
					'You are not authorized to update this artwork';
				logger.error(errorMessage);
				throw new Error(errorMessage);
			}

			// Validate status nếu được update
			if (
				options.status &&
				!['available', 'sold', 'hidden', 'selling'].includes(
					options.status
				)
			) {
				const errorMessage = 'Invalid artwork status';
				logger.error(errorMessage);
				throw new Error(errorMessage);
			}

			// Thực hiện update
			const updatedArtwork = await Artwork.findOneAndUpdate(
				{ _id: id, artistId },
				options,
				{
					new: true, // Trả về document mới sau khi update
					runValidators: true // Chạy các validator của schema
				}
			).exec();

			if (!updatedArtwork) {
				const errorMessage = 'Update failed';
				logger.error(errorMessage);
				throw new Error(errorMessage);
			}

			return updatedArtwork;
		} catch (error) {
			logger.error(`Error updating artwork: ${error}`);
			throw error;
		}
	}

	async delete(id: string, artistId: string): Promise<boolean> {
		try {
			if (!Types.ObjectId.isValid(id)) {
				const errorMessage = 'Invalid artwork id';
				logger.error(errorMessage);
				return false;
			}
			const existingArtwork = await Artwork.findById(id);
			if (!existingArtwork) {
				const errorMessage = 'Artwork not found';
				logger.error(errorMessage);
				return false;
			}
			if (!existingArtwork.artistId) {
				const errorMessage = 'Artwork does not have an artistId';
				logger.error(errorMessage);
				return false;
			}
			if (existingArtwork.artistId.toString() !== artistId) {
				const errorMessage =
					'You are not authorized to update this artwork';
				logger.error(errorMessage);
				return false;
			}

			// Delete artwork
			await Artwork.findByIdAndDelete(id).exec();
			return true;
		} catch (error) {
			logger.error(`Error deleting artwork: ${error}`);
			return false;
		}
	}
	async getCategory(): Promise<string[]> {
		try {
			const categories = await Artwork.distinct('category').exec();
			return categories;
		} catch (error) {
			logger.error(`Error get category artwork: ${error}`);
			throw error;
		}
	}

	async getArtistArtwork(artistId: string): Promise<InstanceType<typeof Artwork>[]> {
		try {
			if (!Types.ObjectId.isValid(artistId)) {
				const errorMessage = 'Invalid artist id';
				logger.error(errorMessage);
				throw new Error(errorMessage);
			}
			const artworks = await Artwork.find({ artistId }).exec();
			return artworks;
		} catch (error) {
			logger.error(`Error fetching artworks by artist id ${artistId}: ${error}`);
			throw error;
		}
	}

	async purchase(artworkId: string, userId: string): Promise<{url: string}> {
		try {
			// Kiểm tra artwork có tồn tại và đang bán không
			const artwork = await Artwork.findOne({
				_id: artworkId,
				status: 'selling'
			});

			if (!artwork) {
				throw new Error('Artwork not found or not available for purchase');
			}

			// Lấy ví của người mua
			const wallet = await Wallet.findOne({ userId });
			if (!artwork.price) {
				throw new Error('Artwork price is not set');
			}
			if (!wallet || wallet.balance < artwork.price) {
				throw new Error('Insufficient balance');
			}

			console.log('artwork.url', artwork.url)

			// Thực hiện thanh toán
			await this.walletService.payment(
				userId,
				artwork.price || 0,
				`Purchase artwork: ${artwork.title}`
			);


			return {
				url: artwork.url
			};

		} catch (error) {
			logger.error(`Error purchasing artwork: ${error}`);
			throw error;
		}
	}
}
