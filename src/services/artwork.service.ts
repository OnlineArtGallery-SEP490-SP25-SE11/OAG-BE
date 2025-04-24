import logger from '@/configs/logger.config';
import Artwork from '@/models/artwork.model';
import User from '@/models/user.model';
import { AiService } from '@/services/ai.service';
import { inject, injectable } from 'inversify';
import { FilterQuery, Types } from 'mongoose';
import NotificationService from '@/services/notification.service';
import Wallet from '@/models/wallet.model';
import WalletService from '@/services/wallet.service';
import { TYPES } from '@/constants/types';
import ArtworkWarehouseModel from '@/models/artwork-warehouse.model';
import Transaction from '@/models/transaction.model';
import { BadRequestException } from '@/exceptions/http-exception';

export interface ArtworkQueryOptions {
	select?: string;
	title?: string;
	category?: string;
	status?: string;
	description?: string;
	artistName?: string;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	keyword?: string;
	priceRange?: {
		min?: number;
		max?: number;
	};
}

export interface ArtworkUpdateOptions {
	title?: string;
	description?: string;
	category?: [string];
	status?: string;
	price?: number;

	//AI
	moderationStatus?: string;
	moderationReason?: string;
	moderatedBy?: 'ai';
	aiReview?: {
		keywords: string[];
		suggestedCategories: string[];
		description: string;
		metadata: {};
		improvements: string[];
	};
}

@injectable()
export class ArtworkService {

	/**
	 * Thêm artwork mới.
	*/
	
	constructor(
		@inject(TYPES.WalletService) private walletService: WalletService,
		@inject(Symbol.for('AiService')) private readonly aiService: AiService
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
		lowResUrl: string,
		watermarkUrl: string,
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
				} else if (
					aiReview.reason &&
					aiReview.reason.toLowerCase().includes('reject')
				) {
					// AI từ chối rõ ràng, trong reason có reject
					moderationStatus = 'rejected';
					moderatedBy = 'ai';
					moderationReason =
						aiReview.reason || 'Content violates guidelines';
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
				lowResUrl,
				watermarkUrl,
				status,
				price,
				artistId,
				moderationStatus,
				moderationReason,
				moderatedBy,
				aiReview: aiReviewData
			});

			const savedArtwork = await artwork.save();

			// Gửi thông báo dựa trên trạng thái moderation
			if (moderationStatus === 'approved' || moderationStatus === 'rejected') {
				let notificationTitle = '';
				let notificationContent = '';
				
				if (moderationStatus === 'approved') {
					notificationTitle = 'Artwork Approved';
					notificationContent = `Your artwork "${title}" has been automatically approved and is now visible to others.`;
				} else {
					notificationTitle = 'Artwork Rejected';
					notificationContent = `Your artwork "${title}" has been rejected. Reason: ${moderationReason || 'No reason provided'}`;
				}
				
				await NotificationService.createNotification({
					title: notificationTitle,
					content: notificationContent,
					userId: artistId,
					isSystem: true,
					refType: 'artwork',
					refId: savedArtwork._id.toString()
				});
				
				logger.info(`Notification sent to artist ${artistId} about new artwork status: ${moderationStatus}`);
			}

			return savedArtwork;
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
			const { select, sortBy, sortOrder, keyword, priceRange, artistName, ...rest } = options;
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

			// Xử lý category - khi có nhiều category (OR logic)
			if (options.category) {
				if (Array.isArray(options.category)) {
					// Nếu là mảng category, tìm artwork có BẤT KỲ category nào trong mảng
					query.category = { $in: options.category };
				} else {
					// Nếu là string, tìm artwork có category này
					query.category = { $regex: options.category, $options: 'i' };
				}
			}
			
			// Tìm kiếm theo tên nghệ sĩ (hỗ trợ nhiều tên)
			if (artistName) {
				let artistQuery;
				
				if (Array.isArray(artistName)) {
					// Nhiều tên nghệ sĩ - tìm kiếm với $or
					artistQuery = {
						$or: artistName.map(name => ({ name: { $regex: name, $options: 'i' } }))
					};
				} else {
					// Một tên nghệ sĩ
					artistQuery = {
						name: { $regex: artistName, $options: 'i' }
					};
				}
				
				const artistIds = await User.find(artistQuery)
					.select('_id')
					.exec();
					
				query.artistId = { $in: artistIds.map(a => a._id) };
			}

			// Tìm kiếm nâng cao theo keyword (tìm trong title, category, description, tên tác giả và AI review)
			if (keyword) {
				// Tìm tác giả theo keyword
				const artistQuery = {
					name: { $regex: keyword, $options: 'i' }
				};
				const artistIds = await User.find(artistQuery)
					.select('_id')
					.exec();
					
				// Tạo điều kiện $or để tìm trong nhiều trường
				query.$or = [
					{ title: { $regex: keyword, $options: 'i' } },
					{ description: { $regex: keyword, $options: 'i' } },
					{ category: { $regex: keyword, $options: 'i' } },
					{ artistId: { $in: artistIds.map(a => a._id) } },
					{ 'aiReview.keywords': { $regex: keyword, $options: 'i' } },
					{ 'aiReview.description': { $regex: keyword, $options: 'i' } },
					{ 'aiReview.suggestedCategories': { $regex: keyword, $options: 'i' } }
				];
			}

			// Lọc theo khoảng giá
			if (priceRange) {
				query.price = {};
				if (priceRange.min !== undefined) {
					query.price.$gte = priceRange.min;
				}
				if (priceRange.max !== undefined) {
					query.price.$lte = priceRange.max;
				}
			}

			// Áp dụng bộ lọc dựa trên quyền hạn người dùng
			this._applyPermissionFilters(query, userContext);

			let sortOptions: Record<string, 1 | -1> = { createdAt: -1 }; // Default sort

			if (sortBy) {
				// Ensure sortBy is a valid field to prevent injection attacks
				const validSortFields = [
					'title',
					'price',
					'createdAt',
					'status',
					'category'
				];
				if (validSortFields.includes(sortBy)) {
					sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
				}
			}
			// Thực hiện truy vấn
			const artworkQuery = Artwork.find(query).sort(sortOptions);
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
				const aiReviewResult = await this.aiService.reviewUpdateArtwork(
					artworkForReview
				);

				// Update options with AI review results
				updatedOptions = {
					...updatedOptions,
					moderationStatus: aiReviewResult.approved
						? 'approved'
						: 'pending',
					moderationReason: aiReviewResult.reason,
					moderatedBy: 'ai',
					aiReview: {
						keywords: aiReviewResult.keywords || [],
						suggestedCategories:
							aiReviewResult.suggestedCategories || [],
						description: aiReviewResult.description || '',
						metadata: aiReviewResult.metadata || {},
						improvements: aiReviewResult.improvements || []
					}
				};

				if (
					existingArtwork.moderationStatus === 'rejected' &&
					aiReviewResult.approved
				) {
					logger.info(
						`Previously rejected artwork ${id} is now approved by AI after updates`
					);
				}

				logger.info(
					`AI review completed for updated artwork ${id}: ${
						aiReviewResult.approved ? 'approved' : 'pending'
					}`
				);
			} catch (aiError: any) {
				// If AI review fails, set the artwork to pending for manual review
				logger.error(
					`AI review failed for updated artwork ${id}: ${aiError.message}`
				);
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

			const prevStatus = existingArtwork.moderationStatus;
			const newStatus = updatedOptions.moderationStatus;

			// Gửi thông báo nếu trạng thái đã thay đổi
			if (newStatus !== prevStatus && (newStatus === 'approved' || newStatus === 'rejected')) {
				let notificationTitle = '';
				let notificationContent = '';
				
				if (newStatus === 'approved') {
					notificationTitle = 'Updated Artwork Approved';
					notificationContent = `Your updated artwork "${updatedArtwork.title}" has been approved and is now visible to others.`;
				} else {
					notificationTitle = 'Updated Artwork Rejected';
					notificationContent = `Your updated artwork "${updatedArtwork.title}" has been rejected. Reason: ${updatedOptions.moderationReason || 'No reason provided'}`;
				}
				
				await NotificationService.createNotification({
					title: notificationTitle,
					content: notificationContent,
					userId: artistId,
					isSystem: true,
					refType: 'artwork',
					refId: id
				});
				
				logger.info(`Notification sent to artist ${artistId} about updated artwork status: ${newStatus}`);
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
		approved: "approved" | "rejected" | "suspended",
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
			artwork.moderationStatus = approved;
			artwork.moderationReason = reason || '';
			artwork.moderatedBy = 'admin';

			// Lưu thay đổi bằng hàm updateOne
			const updatedArtwork = await artwork.updateOne({
				moderationStatus: artwork.moderationStatus,
				moderationReason: artwork.moderationReason,
				moderatedBy: artwork.moderatedBy
			});
			logger.info(
				`Admin ${adminId} reviewed artwork ${artworkId}: ${
					approved
				}`
			);
			if (artwork.artistId) {
            let notificationTitle = '';
            let notificationContent = '';
            
            switch (approved) {
                case 'approved':
                    notificationTitle = 'Artwork Approved by Admin';
                    notificationContent = `Your artwork "${artwork.title}" has been approved by an administrator and is now visible to others.`;
                    break;
                case 'rejected':
                    notificationTitle = 'Artwork Rejected by Admin';
                    notificationContent = `Your artwork "${artwork.title}" has been rejected by an administrator. Reason: ${reason || 'No reason provided'}`;
                    break;
                case 'suspended':
                    notificationTitle = 'Artwork Suspended by Admin';
                    notificationContent = `Your artwork "${artwork.title}" has been temporarily suspended by an administrator. Reason: ${reason || 'No reason provided'}`;
                    break;
            }
            
            await NotificationService.createNotification({
                title: notificationTitle,
                content: notificationContent,
                userId: artwork.artistId.toString(),
                isSystem: true,
                refType: 'artwork',
                refId: artworkId
            });
            
            logger.info(`Notification sent to artist ${artwork.artistId} about artwork ${artworkId} status: ${approved}`);
        }
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

	async getArtistArtwork(
		artistId: string
	): Promise<InstanceType<typeof Artwork>[]> {
		try {
			if (!Types.ObjectId.isValid(artistId)) {
				const errorMessage = 'Invalid artist id';
				logger.error(errorMessage);
				throw new Error(errorMessage);
			}
			const artworks = await Artwork.find({ artistId }).exec();
			return artworks;
		} catch (error) {
			logger.error(
				`Error fetching artworks by artist id ${artistId}: ${error}`
			);
			throw error;
		}
	}

	async purchase(artworkId: string, userId: string): Promise<{url: string, fileName: string}> {
		try {
			// Kiểm tra artwork có tồn tại và đang bán không
			const artwork = await Artwork.findOne({
				_id: artworkId,
				status: 'selling'
			});

			if (!artwork) {
				throw new Error('Artwork not found or not available for purchase');
			}

			// Kiểm tra xem người dùng đã mua artwork này chưa
			if (artwork.buyers?.includes(userId)) {
				// Người dùng đã mua tranh này rồi
				const fileName = artwork.title.replace(/\s+/g, '_') + '.jpg';
				return {
					url: artwork.url,
					fileName: fileName
				};
			}

			// Lấy ví của người mua
			const wallet = await Wallet.findOne({ userId });
			if (!artwork.price) {
				throw new Error('Artwork price is not set');
			}
			if (!wallet || wallet.balance < artwork.price) {
				throw new Error('Insufficient balance');
			}

			// Thực hiện thanh toán
			await this.walletService.payment(
				userId,
				artwork.price || 0,
				`Purchase artwork: ${artwork.title}`
			);

			// Tính toán phí hoa hồng 3%
			const commissionRate = 0.03;
			const commissionAmount = artwork.price * commissionRate;
			const artistAmount = artwork.price - commissionAmount;
			
			// Cộng tiền vào ví của artist (đã trừ hoa hồng)
			let artistWallet = await Wallet.findOne({ userId: artwork.artistId });
			if (!artistWallet) {
				artistWallet = await Wallet.create({
					userId: artwork.artistId,
					balance: 0
				});
			}

			// Sử dụng phương thức addFunds mới
			await this.walletService.addFunds(artistWallet._id?.toString(), artistAmount, {
				userId: artwork.artistId?.toString() || '',
				type: 'SALE',
				status: 'PAID',
				description: `Sold artwork: ${artwork.title} (after 3% commission)`,
				orderCode: Date.now().toString()
			});
			
			// Tạo transaction ghi nhận phí hoa hồng
			await Transaction.create({
				walletId: artistWallet._id,
				userId: artwork.artistId,
				amount: commissionAmount,
				type: 'COMMISSION',
				status: 'PAID',
				description: `Commission fee (3%) for artwork: ${artwork.title}`,
				commissionRate: commissionRate,
				orderCode: Date.now()
			});

			// Cập nhật danh sách người mua mà KHÔNG thay đổi trạng thái
			await Artwork.findByIdAndUpdate(
				artworkId,
				{ 
					$addToSet: { buyers: userId }
					// Không thay đổi status thành 'sold' nữa
				}
			);

			// Thêm tranh vào kho của người dùng
			await ArtworkWarehouseModel.create({
				userId,
				artworkId,
				purchasedAt: new Date(),
				downloadCount: 0
			});

			// Lấy tên file từ url
			const fileName = artwork.title.replace(/\s+/g, '_') + '.jpg';

			return {
				url: artwork.url,
				fileName: fileName
			};
		} catch (error) {
			logger.error(`Error purchasing artwork: ${error}`);
			throw error;
		}
	}

	async verifyDownloadAccess(artworkId: string, userId: string): Promise<boolean> {
		try {
			const artwork = await this.getById(artworkId);
			
			if (!artwork) {
				throw new Error('Artwork not found');
			}
			
			// Cho phép người dùng tải xuống nếu:
			// 1. Họ là artist của artwork, hoặc
			// 2. Họ đã mua artwork này
			const isArtist = artwork.artistId?.toString() === userId;
			const hasPurchased = artwork.buyers?.includes(userId);
			
			return isArtist || hasPurchased || false;
		} catch (error) {
			logger.error(`Error verifying download access: ${error}`);
			throw error;
		}
	}

	/**
	 * Kiểm tra xem người dùng đã mua tranh hay chưa
	 * @param artworkId ID của tranh
	 * @param userId ID của người dùng
	 * @returns true nếu người dùng đã mua tranh, false nếu chưa
	 */
	async hasPurchased(artworkId: string, userId: string): Promise<boolean> {
		try {
			if (!Types.ObjectId.isValid(artworkId)) {
				throw new BadRequestException('ID tranh không hợp lệ');
			}
			
			if (!Types.ObjectId.isValid(userId)) {
				throw new BadRequestException('ID người dùng không hợp lệ');
			}
			
			// Kiểm tra trong danh sách buyers của artwork
			const artwork = await Artwork.findById(artworkId);
			
			if (!artwork) {
				throw new BadRequestException('Không tìm thấy tranh');
			}
			
			// Kiểm tra nếu người dùng là artist của tranh
			if (artwork.artistId?.toString() === userId) {
				return true; // Artist luôn có quyền truy cập tranh của mình
			}
			
			// Kiểm tra nếu người dùng đã mua tranh
			const hasBought = artwork.buyers?.includes(userId) || false;
			
			// Kiểm tra thêm trong kho tranh của người dùng
			if (!hasBought) {
				const artworkInWarehouse = await ArtworkWarehouseModel.findOne({
					artworkId,
					userId
				});
				
				return !!artworkInWarehouse;
			}
			
			return hasBought;
		} catch (error) {
			logger.error(`Lỗi khi kiểm tra quyền sở hữu tranh: ${error}`);
			throw error;
		}
	}
}
