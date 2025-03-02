import logger from '@/configs/logger.config';
import Artwork from '@/models/artwork.model';
import { injectable } from 'inversify';
import { FilterQuery, Types } from 'mongoose';

export interface ArtworkQueryOptions {
	title?: string;
	category?: string;
	status?: string;
	description?: string;
}

@injectable()
export class ArtworkService {
	/**
	 * Thêm artwork mới.
	 */
	async add(
		title: string,
		description: string,
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
			const artwork = new Artwork({
				title,
				description,
				category,
				dimensions,
				url,
				status,
				price
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
			const query: FilterQuery<typeof Artwork> = { ...options };

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
			let artworkQuery = Artwork.find(query).sort({ createdAt: -1 });
			if (typeof skip === 'number' && skip >= 0) {
				artworkQuery = artworkQuery.skip(skip);
			}
			if (typeof take === 'number' && take > 0) {
				artworkQuery = artworkQuery.limit(take);
			}

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
			const artwork = await Artwork.findById(id).exec();
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
}
