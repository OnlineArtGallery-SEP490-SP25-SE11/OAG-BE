import {TYPES} from '@/constants/types';
import {BaseHttpResponse} from '@/lib/base-http-response';
import {ArtworkService} from '@/services/artwork.service';
import {NextFunction, Request, Response} from 'express';
import {inject, injectable} from 'inversify';

@injectable()
export class ArtworkController {
    constructor(
        @inject(TYPES.ArtworkService)
        private readonly _artworkService: ArtworkService
    ) {
        this.get = this.get.bind(this);
        this.getById = this.getById.bind(this);
        this.getCategory = this.getCategory.bind(this);
        this.getForArtist = this.getForArtist.bind(this);
        this.getForAdmin = this.getForAdmin.bind(this);
        this.add = this.add.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.reviewArtwork = this.reviewArtwork.bind(this);
		this.getArtistArtwork = this.getArtistArtwork.bind(this);
		this.purchase = this.purchase.bind(this);
		this.downloadArtwork = this.downloadArtwork.bind(this);
		this.checkPurchaseStatus = this.checkPurchaseStatus.bind(this);
        this.incrementView = this.incrementView.bind(this);
        
	}

    private validateArtworkData(
        artType: string,
        isSelling: boolean,
        status: string
    ): void {
        // Validate artType
        if (!['painting', 'digitalart'].includes(artType)) {
            throw new Error('Loại tranh không hợp lệ');
        }

        // Validate trạng thái bán cho painting
        if (artType === 'painting' && isSelling) {
            throw new Error('Tranh painting không thể bán');
        }

        // Validate trạng thái selling
        if (status === 'selling') {
            if (artType !== 'digitalart') {
                throw new Error('Chỉ tranh digitalart mới có thể có trạng thái selling');
            }
            if (!isSelling) {
                throw new Error('Tranh có trạng thái selling phải có isSelling là true');
            }
        }

        // Validate status hợp lệ
        if (!['available', 'hidden', 'selling'].includes(status)) {
            throw new Error('Trạng thái không hợp lệ');
        }
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
                artType,
                isSelling = false,
                price
            } = req.body;
            const artistId = req.userId;
            // valid artistId
            if (!artistId) {
                const errorMessage = 'Invalid artist id';
                throw new Error(errorMessage);
            }
            // Kiểm tra loại tranh và trạng thái
            this.validateArtworkData(artType, isSelling, status);
            const artwork = await this._artworkService.add(
                title,
                description,
                artistId,
                category,
                dimensions,
                url,
                status,
                price,
                artType,
                isSelling
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
            const {skip: skipStr, take: takeStr, keyword, minPrice, maxPrice, ...restQuery} = req.query;
            
            // Create a properly typed queryOptions object
            const queryOptions: any = {...restQuery};
            
            // Convert to numbers if provided, use defaults if not
            const skip = skipStr ? parseInt(skipStr as string) : 0;
            const take = takeStr ? parseInt(takeStr as string) : 10;

            // Add keyword search if provided
            if (keyword) {
                queryOptions.keyword = keyword as string;
            }
            
            // Handle price range separately to avoid type errors
            if (minPrice || maxPrice) {
                queryOptions.priceRange = {
                    min: minPrice ? parseFloat(minPrice as string) : undefined,
                    max: maxPrice ? parseFloat(maxPrice as string) : undefined
                };
            }

            const {artworks, total} = await this._artworkService.get(
                queryOptions,
                skip,
                take,
                {
                    role: 'user'
                }
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

    async getForArtist(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const {skip: skipStr, take: takeStr, ...restQuery} = req.query;
            
            // Create a properly typed queryOptions object
            const queryOptions: any = {...restQuery};
            
            // Convert to numbers if provided, use defaults if not
            const skip = skipStr ? parseInt(skipStr as string) : 0;
            const take = takeStr ? parseInt(takeStr as string) : 10;
            
            const userId = req.userId;

            if (!userId) {
                throw new Error('Unauthorized');
            }

            // Use artistId from the authenticated user to filter artworks
            queryOptions.artistId = userId;

            const {artworks, total} = await this._artworkService.get(
                queryOptions,
                skip,
                take,
                {userId, role: 'artist'}
            );

            const response = BaseHttpResponse.success(
                {artworks, total},
                200,
                'Get artist artworks success'
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async getForAdmin(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<any> {
        try {
            const {skip: _skip, take: _take, ...queryOptions} = req.query;
            void _skip;
            void _take;

            const skip = parseInt(req.query.skip as string) || 0;
            const take = parseInt(req.query.take as string) || 10;

            const {artworks, total} = await this._artworkService.get(
                queryOptions,
                skip,
                take,
                {role: 'admin'} // Đặt context là admin để xem tất cả
            );

            const response = BaseHttpResponse.success(
                {artworks, total},
                200,
                'Get all artworks success'
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
            const {id} = req.params;
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
            const {id} = req.params;
            const {
                title,
                description,
                category,
                status,
                artType,
                isSelling,
                price
            } = req.body;
            const artistId = req.userId;
            // valid artistId
            if (!artistId) {
                const errorMessage = 'Invalid artist id';
                throw new Error(errorMessage);
            }
            // Nếu cập nhật status thành selling, phải kiểm tra artType
            if (status === 'selling' && artType !== 'digitalart') {
                throw new Error('Chỉ tranh digitalart mới có thể có trạng thái selling');
            }
            // Nếu có cập nhật các trường liên quan đến bán hàng, validate
            if (artType !== undefined || isSelling !== undefined || status !== undefined) {
                // Lấy artwork hiện tại để có thông tin đầy đủ cho validation
                const currentArtwork = await this._artworkService.getById(id);
                
                this.validateArtworkData(
                    artType || currentArtwork.artType,
                    isSelling ?? currentArtwork.isSelling,
                    status || currentArtwork.status
                );
            }
            const artwork = await this._artworkService.update(
                {
                    title,
                    description,
                    category,
                    status,
                    artType,
                    isSelling,
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
            const {id} = req.params;
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

    async getCategory(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<any> {
        try {
            const categories = await this._artworkService.getCategory();
            const response = BaseHttpResponse.success(
                categories,
                200,
                'Get category success'
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async reviewArtwork(
        req: Request,
        res: Response,
        next: NextFunction
    ):Promise<any> {
        try {
            const {id} = req.params;
            const {moderationStatus, moderationReason} = req.body;
            const adminId = req.userId;
            // valid artistId
            if (!adminId) {
                const errorMessage = 'Invalid admin id';
                throw new Error(errorMessage);
            }
            const artwork = await this._artworkService.reviewArtwork(
                id,
                adminId,
                moderationStatus,
                moderationReason
            );
            const response = BaseHttpResponse.success(
                artwork,
                200,
                'Review artwork success'
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error)
        }
    }

	async getArtistArtwork(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {

			const artworks = await this._artworkService.getArtistArtwork(req.userId!);
			const response = BaseHttpResponse.success(
				{artworks},
				200,
				'Get artist artwork success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}

	async purchase(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const { id } = req.params;
			const userId = req.userId;
			
			if (!userId) {
				throw new Error('User not authenticated');
			}

			const result = await this._artworkService.purchase(id, userId);
			
			// Lấy thông tin artwork để tính toán hoa hồng (để hiển thị)
			const artwork = await this._artworkService.getById(id);
			const commissionRate = 0.03;
			const commissionAmount = (artwork.price || 0) * commissionRate;
			const artistAmount = (artwork.price || 0) - commissionAmount;
			
			const response = BaseHttpResponse.success(
				{
					...result,
					price: artwork.price,
					artistAmount,
					commissionAmount,
					commissionRate: "3%"
				},
				200,
				'Purchase artwork success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}

	async downloadArtwork(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const { id } = req.params;
			const userId = req.userId;
			
			if (!userId) {
				throw new Error('User not authenticated');
			}
			
			// Kiểm tra quyền truy cập trước khi cho phép tải xuống
			const hasAccess = await this._artworkService.verifyDownloadAccess(id, userId);
			
			if (!hasAccess) {
				return res.status(403).json(
					BaseHttpResponse.error('Unauthorized access to download this artwork', 403)
				);
			}
			
			// Lấy thông tin artwork
			const artwork = await this._artworkService.getById(id);
			
			// Tạo tên file phù hợp
			const fileName = artwork.title.replace(/\s+/g, '_') + '.jpg';
			
			// Thiết lập header để tải xuống
			res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
			
			// Chuyển hướng đến URL của file để tải xuống
			res.redirect(artwork.url);
			
		} catch (error) {
			next(error);
		}
	}

	async checkPurchaseStatus(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const { id } = req.params;
			const userId = req.userId;
			
			if (!userId) {
				throw new Error('Người dùng chưa đăng nhập');
			}
			
			const hasPurchased = await this._artworkService.hasPurchased(id, userId);
			
			const response = BaseHttpResponse.success(
				{ hasPurchased },
				200,
				'Kiểm tra trạng thái mua tranh thành công'
			);
			
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}

    /**
     * Tăng lượt xem cho artwork
     */
    async incrementView(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<any> {
        try {
            const { id } = req.params;
            
            const newViews = await this._artworkService.incrementView(id);
            
            const response = BaseHttpResponse.success(
                { views: newViews },
                200,
                'Tăng lượt xem thành công'
            );
            
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }


}


