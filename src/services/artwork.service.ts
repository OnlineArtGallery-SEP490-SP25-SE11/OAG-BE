import logger from '@/configs/logger.config';
import Artwork from '@/models/artwork.model';
import User from '@/models/user.model';
import { AiService } from '@/services/ai.service';
import { inject, injectable } from 'inversify';
import mongoose, { FilterQuery, Types } from 'mongoose';
import NotificationService from '@/services/notification.service';
import Wallet from '@/models/wallet.model';
import WalletService from '@/services/wallet.service';
import { TYPES } from '@/constants/types';
import ArtworkWarehouseModel from '@/models/artwork-warehouse.model';
import Transaction from '@/models/transaction.model';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@/exceptions/http-exception';
import { ErrorCode } from '@/constants/error-code';
import Exhibition from '@/models/exhibition.model';
import CollectionModel from '@/models/collection.model';

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
	artType?: 'painting' | 'digitalart';
	isSelling?: boolean;
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
	views?: number;
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
		price: number,
		artType: 'painting' | 'digitalart',
		isSelling: boolean = false
	): Promise<InstanceType<typeof Artwork>> {
		try {
			// Validate artistId
			if (!Types.ObjectId.isValid(artistId)) {
				throw new Error('Invalid artist id');
			}

			// Nếu là painting, đảm bảo isSelling luôn là false
			const finalIsSelling = artType === 'painting' ? false : isSelling;

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
				artType,
				isSelling: finalIsSelling,
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
					refId: savedArtwork._id as string
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
			// Validate IDs
			if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(artistId)) {
				throw new BadRequestException('ID không hợp lệ');
			}

			// Tìm artwork hiện tại
			const existingArtwork = await Artwork.findById(id);
			if (!existingArtwork) {
				throw new NotFoundException('Không tìm thấy artwork');
			}

			// Kiểm tra quyền sở hữu
			if (existingArtwork.artistId?.toString() !== artistId) {
				throw new BadRequestException('Bạn không có quyền cập nhật artwork này');
			}

			// Clone options để không ảnh hưởng đến object gốc
			const updateData = { ...options };

			// Xác định artType cuối cùng
			const artType = updateData.artType || existingArtwork.artType;

			// Kiểm tra artType hợp lệ
			if (artType !== 'painting' && artType !== 'digitalart') {
				throw new BadRequestException('Loại artwork không hợp lệ');
			}

			// Xử lý cho painting
			if (artType === 'painting') {
				updateData.isSelling = false;
				if (updateData.status === 'selling') {
					throw new BadRequestException('Tranh painting không thể bán');
				}
			}

			// Xử lý cho digitalart
			if (artType === 'digitalart') {
				// Nếu đang cập nhật status thành selling, tự động set isSelling = true
				if (updateData.status === 'selling') {
					updateData.isSelling = true;
				}
				// Nếu đang cập nhật status khác selling, tự động set isSelling = false
				else if (updateData.status && updateData.status !== 'selling') {
					updateData.isSelling = false;
				}
			}

			// Log thông tin update để debug
			logger.info(`Updating artwork ${id}:`, {
				existingType: existingArtwork.artType,
				newType: artType,
				updateData
			});

			// Thực hiện update
			const updatedArtwork = await Artwork.findOneAndUpdate(
				{ _id: id, artistId },
				{ $set: updateData },
				{
					new: true,
					runValidators: true
				}
			).populate({
				path: 'artistId',
				select: 'name image',
				model: 'User'
			});

			if (!updatedArtwork) {
				throw new InternalServerErrorException('Cập nhật artwork thất bại');
			}

			logger.info(`Updated artwork ${id} successfully`);
			return updatedArtwork;
		} catch (error) {
			logger.error(`Error updating artwork ${id}:`, error);
			throw error;
		}
	}

	async delete(id: string, artistId: string): Promise<boolean> {
    try {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID artwork không hợp lệ');
        }

        const existingArtwork = await Artwork.findById(id);
        if (!existingArtwork) {
            throw new NotFoundException('Không tìm thấy artwork');
        }

        // Check ownership
        if (existingArtwork.artistId?.toString() !== artistId) {
            throw new BadRequestException('Bạn không có quyền xóa artwork này');
        }

        // Delete references in other collections
        try {
            // 1. Delete artwork from exhibitions
            await Exhibition.updateMany(
                { 'artworkPositions.artwork': id },
                { $pull: { artworkPositions: { artwork: id } } }
            );

            // 2. Delete artwork likes from exhibitions
            await Exhibition.updateMany(
                { 'result.likes.artworkId': id },
                { $pull: { 'result.likes': { artworkId: id } } }
            );

            // 3. Delete from collections
            await CollectionModel.updateMany(
                { artworks: id },
                { $pull: { artworks: id } }
            );

            // 4. Delete from warehouse
            await ArtworkWarehouseModel.deleteMany({ artworkId: id });

            // 5. Finally delete the artwork itself
            await Artwork.findByIdAndDelete(id);

            logger.info(`Successfully deleted artwork ${id} and all its references`);
            return true;

        } catch (error) {
            logger.error(`Error deleting artwork references: ${error}`);
            throw new InternalServerErrorException(
                'Lỗi khi xóa artwork',
                ErrorCode.DATABASE_ERROR
            );
        }
    } catch (error) {
        logger.error(`Error deleting artwork: ${error}`);
        if (error instanceof BadRequestException || 
            error instanceof NotFoundException ||
            error instanceof InternalServerErrorException) {
            throw error;
        }
        throw new InternalServerErrorException(
            'Lỗi khi xóa artwork',
            ErrorCode.DATABASE_ERROR
        );
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
				`Admin ${adminId} reviewed artwork ${artworkId}: ${approved
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

	async purchase(artworkId: string, userId: string): Promise<{ url: string, fileName: string }> {
		try {
			// Tìm artwork và validate
			const artwork = await Artwork.findById(artworkId);

			if (!artwork) {
				throw new Error('Artwork không tìm thấy');
			}

			// Validate điều kiện mua
			if (artwork.artType !== 'digitalart') {
				throw new Error('Chỉ có thể mua tranh digitalart');
			}

			if (!artwork.isSelling || artwork.status !== 'selling') {
				throw new Error('Artwork này không được bán');
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
			await this.walletService.addFunds(artistWallet._id as string, artistAmount, {
				userId: artwork.artistId?.toString() || '',
				type: 'SALE',
				status: 'PAID',
				description: `Sold artwork: ${artwork.title} (after 3% commission)`,
				// orderCode: Date.now().toString()
			});

			// Tạo transaction ghi nhận phí hoa hồng
			// await Transaction.create({
			// 	walletId: artistWallet._id,
			// 	userId: artwork.artistId,
			// 	amount: commissionAmount,
			// 	type: 'COMMISSION',
			// 	status: 'PAID',
			// 	description: `Commission fee (3%) for artwork: ${artwork.title}`,
			// 	commissionRate: commissionRate,
			// 	// orderCode: Date.now()
			// });

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

	/**
	 * Tăng lượt xem cho artwork và trả về số lượt xem mới
	 * @param artworkId ID của artwork
	 * @returns Số lượt xem mới của artwork
	 */
	async incrementView(artworkId: string): Promise<number> {
		try {
			if (!Types.ObjectId.isValid(artworkId)) {
				throw new BadRequestException('ID artwork không hợp lệ');
			}

			const artwork = await Artwork.findByIdAndUpdate(
				artworkId,
				{ $inc: { views: 1 } }, // Tăng views lên 1
				{ new: true } // Trả về document sau khi update
			);

			if (!artwork) {
				throw new BadRequestException('Không tìm thấy artwork');
			}

			logger.info(`Tăng lượt xem cho artwork ${artworkId}: ${artwork.views}`);
			return artwork.views || 0;
		} catch (error) {
			logger.error(`Lỗi khi tăng lượt xem artwork: ${error}`);
			throw error;
		}
	}


	async getFollowingRecommendations(userId: string, limit: number = 5): Promise<InstanceType<typeof Artwork>[]> {
		try {
			// Find user and populate following
			const user = await User.findById(userId).populate('following');
			if (!user) {
				throw new NotFoundException('User not found');
			}

			// Check if user is following any artists
			if (!user.following || user.following.length === 0) {
				return [];
			}

			// Get IDs of followed artists
			const followingIds = user.following.map(artist => artist._id);

			// Find artworks from followed artists
			return await Artwork.find({
				artistId: { $in: followingIds }, // Changed from 'artist' to 'artistId' to match schema
				status: { $in: ['published', 'selling'] },
				moderationStatus: 'approved' // Add moderation status check
			})
				.select({
					title: 1,
					url: 1,
					price: 1,
					artType: 1,
					isSelling: 1,
					description: 1,
					artistId: 1,
					createdAt: 1,
					dimensions: 1
				})
				.sort({ createdAt: -1 })
				.limit(limit)
				.populate('artistId', 'name image') // Changed from 'artist' to 'artistId' and added 'image'
				.exec();

		} catch (error) {
			logger.error('Error getting following artworks:', error);
			throw new InternalServerErrorException(
				'Error retrieving following artworks',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

}
