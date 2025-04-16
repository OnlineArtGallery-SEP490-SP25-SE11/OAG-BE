import { injectable, inject } from 'inversify';
import { BadRequestException } from '@/exceptions/http-exception';
import { ArtworkService } from './artwork.service';
import WalletService from './wallet.service';
import logger from '@/configs/logger.config';
import { TYPES } from '@/constants/types';
import Wallet from '@/models/wallet.model';
import Transaction from '@/models/transaction.model';
import Artwork from '@/models/artwork.model';

@injectable()
export class ArtworkTransactionService {
    constructor(
        @inject(TYPES.ArtworkService) private artworkService: ArtworkService,
        @inject(TYPES.WalletService) private walletService: WalletService
    ) {}

    async purchaseArtwork(artworkId: string, buyerId: string): Promise<any> {
        try {
            // Kiểm tra artwork
            const artwork = await this.artworkService.getById(artworkId);
            
            if (!artwork) {
                throw new BadRequestException('Artwork not found');
            }

            if (artwork.status !== 'selling') {
                throw new BadRequestException('This artwork is not for sale');
            }

            if (!artwork.artistId) {
                throw new BadRequestException('Artwork does not have an artist');
            }

            if (artwork.artistId.toString() === buyerId) {
                throw new BadRequestException('You cannot buy your own artwork');
            }

            if (!artwork.price || artwork.price <= 0) {
                throw new BadRequestException('Invalid artwork price');
            }

            // Kiểm tra xem người dùng đã mua artwork này chưa
            if (artwork.buyers?.includes(buyerId)) {
                return {
                    success: true,
                    message: 'You already purchased this artwork',
                    artwork,
                    downloadUrl: artwork.url
                };
            }

            // Thực hiện giao dịch
            const paymentResult = await this.walletService.payment(
                buyerId,
                artwork.price,
                `Purchase artwork: ${artwork.title}`
            );

            if (paymentResult.status === 'FAILED') {
                throw new BadRequestException(paymentResult.message);
            }

            try {
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
                await this.walletService.addFunds(artistWallet?._id.toString(), artistAmount, {
                    userId: artwork.artistId.toString(),
                    type: 'SALE',
                    status: 'PAID',
                    description: `Sold artwork: ${artwork.title} (after 3% commission)`
                });
                
                // Tạo transaction ghi nhận phí hoa hồng
                await Transaction.create({
                    walletId: artistWallet._id,
                    userId: artwork.artistId,
                    amount: commissionAmount,
                    type: 'COMMISSION',
                    status: 'PAID',
                    description: `Commission fee (3%) for artwork: ${artwork.title}`
                });

                // Cập nhật artwork
                const updatedArtwork = await Artwork.findByIdAndUpdate(
                    artworkId,
                    { 
                        $addToSet: { buyers: buyerId }
                    },
                    { new: true }
                );

                return {
                    success: true,
                    message: 'Purchase successful',
                    artwork: {
                        ...(updatedArtwork as any),
                        downloadUrl: artwork.url
                    },
                    artistAmount: artistAmount,
                    commissionAmount: commissionAmount,
                    commissionRate: commissionRate
                };

            } catch (error) {
                logger.error('Error completing purchase:', error);
                // TODO: Implement rollback mechanism
                throw new BadRequestException('Failed to complete purchase');
            }

        } catch (error) {
            logger.error('Purchase artwork error:', error);
            throw error;
        }
    }

    // Thêm method để kiểm tra quyền tải ảnh
    async verifyDownloadAccess(artworkId: string, userId: string): Promise<boolean> {
        try {
            const artwork = await this.artworkService.getById(artworkId);
            
            if (!artwork) {
                throw new BadRequestException('Artwork not found');
            }

            // Cho phép artist và người đã mua tải ảnh
            return artwork.artistId?.toString() === userId || 
                   artwork.buyers?.includes(userId) || 
                   false;

        } catch (error) {
            logger.error('Error verifying download access:', error);
            throw error;
        }
    }
} 