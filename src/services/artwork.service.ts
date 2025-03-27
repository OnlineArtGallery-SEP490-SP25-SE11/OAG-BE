import logger from '@/configs/logger.config';
import Artwork from '@/models/artwork.model';
import User from '@/models/user.model.ts';
import { AiService } from '@/services/ai.service.ts';
import { inject, injectable } from 'inversify';
import { FilterQuery, Types } from 'mongoose';
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

	//AI
	moderationStatus?: string
	moderationReason?: string
	moderatedBy?: 'ai',
	aiReview?: {
		keywords: string[],
		suggestedCategories: string [],
		description: string,
		metadata:{},
		improvements: string []

	}
}

@injectable()
export class ArtworkService {
	constructor(
		@inject(Symbol.for('AiService')) private readonly aiService: AiService
	) {}

	/**
	 * Thêm artwork mới.
	 */
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

			let moderationStatus = 'pending';
			let moderationReason = '';
			let moderatedBy = null;
			let aiReviewData = null;

			// Thực hiện AI review
			try {
				const aiReview = await this.aiService.reviewArtwork({
					title,
					description,
					category,
					dimensions,
					url
				});

				// Lưu kết quả AI review
				aiReviewData = {
					keywords: aiReview.keywords || [],
					suggestedCategories: aiReview.suggestedCategories || [],
					description: aiReview.description || '',
					metadata: aiReview.metadata || {}
				};

				// Cập nhật trạng thái duyệt dựa trên kết quả AI
				if (aiReview.approved) {
					moderationStatus = 'approved';
					moderatedBy = 'ai';
				} else if (aiReview.reason && aiReview.reason.toLowerCase().includes('reject')) {
					// AI từ chối rõ ràng, trong reason có reject
					moderationStatus = 'rejected';
					moderatedBy = 'ai';
					moderationReason = aiReview.reason || 'Content violates guidelines';
				} else {
					// status đưa về là reject nhưng reason k reject -> chưa rõ cần admin review
					moderationStatus = 'pending';
					moderationReason = aiReview.reason || 'Needs admin review';
				}

				logger.info(
					`AI review completed for artwork ${title}: ${moderationStatus}`
				);
			} catch (aiError) {
				// Nếu AI review lỗi, để admin duyệt
				logger.error(`AI review failed: ${aiError}`);
				moderationStatus = 'pending';
				moderationReason = 'AI review failed, needs admin review';
			}

			// Tạo và lưu artwork với kết quả moderation
			const artwork = new Artwork({
				title,
				description,
				category,
				dimensions,
				url,
				status,
				price,
				artistId,
				moderationStatus,
				moderationReason,
				moderatedBy,
				aiReview: aiReviewData
			});

			return await artwork.save();
		} catch (error) {
			logger.error(`Error adding artwork: ${error}`);
			throw error;
		}
	}

	/**
	 * Lấy danh sách artworks theo các điều kiện, hỗ trợ phân trang và phân quyền.
	 * @param options Các tùy chọn tìm kiếm
	 * @param skip Số lượng bản ghi bỏ qua (phân trang)
	 * @param take Số lượng bản ghi lấy (phân trang)
	 * @param userContext Thông tin về người dùng đang truy vấn
	 */
	async get(
		options: ArtworkQueryOptions,
		skip: number,
		take: number,
		userContext?: {
			userId?: string;
			role?: 'user' | 'artist' | 'admin';
		}
	): Promise<{
		artworks: Array<Record<string, any>>;
		total: number;
	}> {
		try {
			const { select, ...rest } = options;
			const query: FilterQuery<typeof Artwork> = { ...rest };

			// Xử lý các điều kiện tìm kiếm
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
				query.artistId = { $in: artistIds.map((a) => a._id) };
			}

			// Áp dụng bộ lọc dựa trên quyền hạn người dùng
			this._applyPermissionFilters(query, userContext);

			// Thực hiện truy vấn
			const artworkQuery = Artwork.find(query).sort({ createdAt: -1 });
			
			// Áp dụng phân trang
			this._applyPagination(artworkQuery, skip, take);

			// Chọn các trường cần lấy nếu được chỉ định
			if (select) {
				artworkQuery.select(select);
			}

			// Thêm populate để lấy thông tin artist
			artworkQuery.populate({
				path: 'artistId',
				select: 'name image',
				model: 'User'
			});

			// Thực hiện truy vấn và đếm tổng số kết quả
			const [artworksResult, total] = await Promise.all([
				artworkQuery.exec(),
				Artwork.countDocuments(query).exec()
			]);

			// Chuyển đổi kết quả thành plain objects và lọc thông tin nhạy cảm
			const artworks = this._processArtworkResults(
				artworksResult,
				userContext
			);

			return { artworks, total };
		} catch (error) {
			logger.error(`Error fetching artworks: ${error}`);
			throw error;
		}
	}

	/**
	 * Áp dụng bộ lọc quyền hạn vào query
	 */
	private _applyPermissionFilters(
		query: FilterQuery<typeof Artwork>,
		userContext?: { userId?: string; role?: 'user' | 'artist' | 'admin' }
	): void {
		if (!userContext || userContext.role === 'user') {
			// User thường chỉ xem được tranh đã được duyệt
			query.moderationStatus = 'approved';
		} else if (userContext.role === 'artist' && userContext.userId) {
			// Artist xem được tranh của mình (mọi trạng thái) và tranh đã được duyệt của người khác
			query.$or = [
				{ artistId: userContext.userId },
				{ moderationStatus: 'approved' }
			];
		}
		// Admin xem được tất cả nên không cần thêm điều kiện
	}

	/**
	 * Lấy artwork theo id.
	 */
	/**
	 * Lấy artwork theo id.
	 * @param id Artwork ID
	 * @param userContext Thông tin người dùng đang truy vấn
	 */
	async getById(
		id: string,
		userContext?: {
			userId?: string;
			role?: 'user' | 'artist' | 'admin';
		}
	): Promise<Record<string, any>> {
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

			// Convert to plain object and apply permission filters
			const artworkObj = artwork.toObject();

			// Hide sensitive information based on user role
			if (
				!userContext ||
				userContext.role === 'user' ||
				(userContext.role === 'artist' &&
					userContext.userId !== artworkObj.artistId?._id.toString())
			) {
				delete artworkObj.aiReview;
				delete artworkObj.moderationReason;
				delete artworkObj.moderatedBy;
			}

			return artworkObj;
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

			// Initialize update options with the provided options
			let updatedOptions = { ...options };

			// Prepare artwork data for AI review
			const artworkForReview = {
				title: options.title || existingArtwork.title,
				description: options.description || existingArtwork.description,
				category: options.category || existingArtwork.category,
				dimensions: existingArtwork.dimensions,
				url: existingArtwork.url,
				moderationStatus: existingArtwork.moderationStatus,
				moderationReason: existingArtwork.moderationReason,
				moderatedBy: existingArtwork.moderatedBy,
				aiReview: existingArtwork.aiReview
			};

			try {
				// Use AI to review the updated artwork
				const aiReviewResult = await this.aiService.reviewUpdateArtwork(artworkForReview);

				// Update options with AI review results
				updatedOptions = {
					...updatedOptions,
					moderationStatus: aiReviewResult.approved ? 'approved' : 'pending',
					moderationReason: aiReviewResult.reason,
					moderatedBy: 'ai',
					aiReview: {
						keywords: aiReviewResult.keywords || [],
						suggestedCategories: aiReviewResult.suggestedCategories || [],
						description: aiReviewResult.description || '',
						metadata: aiReviewResult.metadata || {},
						improvements: aiReviewResult.improvements || []
					}
				};

				if (existingArtwork.moderationStatus === 'rejected' && aiReviewResult.approved) {
					logger.info(`Previously rejected artwork ${id} is now approved by AI after updates`);
				}

				logger.info(`AI review completed for updated artwork ${id}: ${aiReviewResult.approved ? 'approved' : 'pending'}`);
			} catch (aiError:any) {
				// If AI review fails, set the artwork to pending for manual review
				logger.error(`AI review failed for updated artwork ${id}: ${aiError.message}`);
				updatedOptions = {
					...updatedOptions,
					moderationStatus: 'pending',
					moderationReason: 'AI review failed, needs manual review'
				};
			}

			// Thực hiện update
			const updatedArtwork = await Artwork.findOneAndUpdate(
				{ _id: id, artistId },
				updatedOptions,
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
	async reviewArtwork(
		artworkId: string,
		adminId: string,
		approved: boolean,
		reason?: string
	): Promise<InstanceType<typeof Artwork>> {
		try {
			if (!Types.ObjectId.isValid(artworkId)) {
				throw new Error('Invalid artwork ID');
			}

			const artwork = await Artwork.findById(artworkId);
			if (!artwork) {
				throw new Error('Artwork not found');
			}

			// Cập nhật thông tin moderation
			artwork.moderationStatus = approved ? 'approved' : 'rejected';
			artwork.moderationReason = reason || '';
			artwork.moderatedBy = 'admin';
			console.log('chay den day roi')
			// Lưu thay đổi bằng hàm updateOne
			const updatedArtwork = await artwork.updateOne({
				moderationStatus: artwork.moderationStatus,
				moderationReason: artwork.moderationReason,
				moderatedBy: artwork.moderatedBy
			});
			logger.info(
				`Admin ${adminId} reviewed artwork ${artworkId}: ${
					approved ? 'approved' : 'rejected'
				}`
			);

			return updatedArtwork;
		} catch (error) {
			logger.error(`Error during admin review of artwork: ${error}`);
			throw error;
		}
	}
	/**
	 * Áp dụng phân trang vào query
	 */
	private _applyPagination(query: any, skip?: number, take?: number): void {
		if (typeof skip === 'number' && skip >= 0) {
			query.skip(skip);
		}
		if (typeof take === 'number' && take > 0) {
			query.limit(take);
		}
	}

	/**
	 * Xử lý kết quả truy vấn để loại bỏ thông tin nhạy cảm
	 */
	private _processArtworkResults(
		artworksResult: any[],
		userContext?: { userId?: string; role?: 'user' | 'artist' | 'admin' }
	): Array<Record<string, any>> {
		return artworksResult.map((artwork) => {
			const artworkObj = artwork.toObject ? artwork.toObject() : artwork;

			// Ẩn thông tin nhạy cảm tùy theo quyền hạn
			if (
				!userContext ||
				userContext.role === 'user' ||
				(userContext.role === 'artist' &&
					userContext.userId !== artworkObj.artistId?.toString())
			) {
				delete artworkObj.aiReview;
				delete artworkObj.moderationReason;
				delete artworkObj.moderatedBy;
			}

			return artworkObj;
		});
	}
}
