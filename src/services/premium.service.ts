import logger from '@/configs/logger.config';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@/exceptions/http-exception';
import PremiumSubscriptionModel, { IPremiumSubscription } from '@/models/premium.model';
import User from '@/models/user.model';
import WalletService from '@/services/wallet.service';
import { inject, injectable } from 'inversify';
import cron from 'node-cron';
import mongoose from 'mongoose';

const PREMIUM_PRICE = 45000;
const PREMIUM_DESCRIPTION = 'Premium Subscription Monthly Fee';

@injectable()
export class PremiumService {
  constructor(
    @inject(Symbol.for('WalletService')) private walletService: WalletService,
  ) {}

  async subscribe(userId: string) {
    try {
      // Kiểm tra subscription hiện tại
      let subscription = await PremiumSubscriptionModel.findOne({ userId });

      if (subscription?.status === 'active') {
        throw new BadRequestException('Bạn đang có gói Premium đang hoạt động');
      }

      const paymentResult = await this.walletService.payment(
        userId,
        PREMIUM_PRICE,
        PREMIUM_DESCRIPTION
      );

      if (paymentResult.status === 'FAILED') {
        throw new BadRequestException(paymentResult.message || 'Thanh toán thất bại');
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      if (subscription) {
        // Cập nhật subscription hiện tại
        subscription = (await PremiumSubscriptionModel.findOneAndUpdate(
          { userId },
          {
            status: 'active',
            startDate,
            endDate,
            lastPaymentDate: startDate,
            nextPaymentDate: endDate,
            autoRenew: true,
            orderId: Date.now().toString()
          },
          { new: true }
        )) as any;
      } else {
        // Tạo subscription mới nếu chưa từng đăng ký
        subscription = (await PremiumSubscriptionModel.create({
          userId,
          startDate,
          endDate,
          status: 'active',
          lastPaymentDate: startDate,
          nextPaymentDate: endDate,
          autoRenew: true,
          orderId: Date.now().toString()
        })) as any;
      }

      // Cập nhật user
      await User.findByIdAndUpdate(userId, {
        premiumStatus: subscription?._id
      });

      if (subscription) {
        this.scheduleAutoRenewal(userId, (subscription._id as mongoose.Types.ObjectId).toString(), endDate);
      }

      return subscription;
    } catch (error) {
      logger.error('Error subscribing to premium:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Đăng ký Premium thất bại');
    }
  }

  async cancelSubscription(userId: string) {
    try {
      const subscription = await PremiumSubscriptionModel.findOneAndUpdate(
        { 
          userId,
          status: 'active'
        },
        { 
          status: 'cancelled',
          autoRenew: false 
        },
        { new: true }
      );

      if (!subscription) {
        throw new NotFoundException('Không tìm thấy gói Premium đang hoạt động');
      }

      return {
        message: `Đăng ký Premium đã được hủy. Bạn vẫn có thể sử dụng các tính năng Premium đến ${subscription.endDate.toLocaleDateString()}`,
        subscription
      };
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Hủy đăng ký Premium thất bại');
    }
  }

  async autoRenew(userId: string, subscriptionId: string) {
    try {
      const subscription = await PremiumSubscriptionModel.findOne({ userId });
      if (!subscription || subscription.status !== 'active' || !subscription.autoRenew) return null;

      const paymentResult = await this.walletService.payment(
        userId,
        PREMIUM_PRICE,
        `${PREMIUM_DESCRIPTION} (Auto-renewal)`
      );

      if (paymentResult.status === 'FAILED') {
        await PremiumSubscriptionModel.findOneAndUpdate(
          { userId },
          { 
            status: 'expired',
            autoRenew: false
          }
        );
        return null;
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      // Cập nhật subscription hiện tại
      const updatedSubscription = await PremiumSubscriptionModel.findOneAndUpdate(
        { userId },
        {
          startDate,
          endDate,
          status: 'active',
          lastPaymentDate: startDate,
          nextPaymentDate: endDate,
          orderId: Date.now().toString()
        },
        { new: true }
      ) as IPremiumSubscription;

      this.scheduleAutoRenewal(userId, (updatedSubscription._id as mongoose.Types.ObjectId).toString(), endDate);

      return updatedSubscription;
    } catch (error) {
      logger.error('Error in auto-renewal:', error);
      return null;
    }
  }

  async checkAndUpdateExpiredSubscriptions() {
    try {
      const now = new Date();
      const expired = await PremiumSubscriptionModel.find({
        endDate: { $lt: now },
        status: { $in: ['active', 'cancelled'] },
      });

      for (const subscription of expired) {
        await PremiumSubscriptionModel.findByIdAndUpdate(subscription._id, { status: 'expired' });
      }

      return { count: expired.length };
    } catch (error) {
      logger.error('Error updating expired subscriptions:', error);
      return { count: 0 };
    }
  }

  private scheduleAutoRenewal(userId: string, subscriptionId: string, endDate: Date) {
    const renewalTime = new Date(endDate.getTime() - 60 * 60 * 1000);

    cron.schedule(
      `${renewalTime.getMinutes()} ${renewalTime.getHours()} ${renewalTime.getDate()} ${renewalTime.getMonth() + 1} *`,
      async () => {
        await this.autoRenew(userId, subscriptionId);
      },
      { scheduled: true, timezone: 'Asia/Ho_Chi_Minh' }
    );

    logger.info(`Scheduled auto-renewal for subscription ${subscriptionId} at ${renewalTime.toISOString()}`);
  }

  async checkUserLimits(userId: string, type: 'gallery_views' | 'artists_follow' | 'collections') {
    try {
      const subscription = await PremiumSubscriptionModel.findOne({
        userId,
        endDate: { $gt: new Date() },
        status: { $in: ['active', 'cancelled'] }
      });

      const limits = {
        gallery_views: { limit: 5, name: '3D Gallery Views', unlimited: false },
        artists_follow: { limit: 10, name: 'Artists You Can Follow', unlimited: false },
        collections: { limit: 1, name: 'Save Favorite Collections', unlimited: false }
      };

      if (subscription) {
        return {
          ...limits[type],
          unlimited: true,
          canUse: true,
          premiumStatus: subscription.status
        };
      }

      return {
        ...limits[type],
        unlimited: false,
        canUse: true,
        premiumStatus: 'none'
      };
    } catch (error) {
      logger.error('Error checking user limits:', error);
      throw new InternalServerErrorException('Kiểm tra giới hạn người dùng thất bại');
    }
  }

  async checkSubscriptionStatus(userId: string) {
    try {
      // Kiểm tra subscription active trước
      let subscription = await PremiumSubscriptionModel.findOne({
        userId,
        status: 'active'
      });

      if (subscription) {
        return {
          premiumStatus: 'active',
          endDate: subscription.endDate,
          subscription,
          autoRenew: subscription.autoRenew,
          message: `Bạn đang sử dụng gói Premium${subscription.autoRenew ? '. Tự động gia hạn' : ''} vào ${subscription.endDate.toLocaleDateString()}`,
          canUseFeatures: true
        };
      }

      // Nếu không có active, kiểm tra cancelled còn hạn
      subscription = await PremiumSubscriptionModel.findOne({
        userId,
        status: 'cancelled',
        endDate: { $gt: new Date() }
      }).sort({ endDate: -1 }); // Lấy subscription cancelled có endDate xa nhất

      if (subscription) {
        return {
          premiumStatus: 'cancelled',
          endDate: subscription.endDate,
          subscription,
          autoRenew: false,
          message: `Bạn đã hủy Premium. Vẫn có thể dùng đến ${subscription.endDate.toLocaleDateString()}`,
          canUseFeatures: true
        };
      }

      // Kiểm tra subscription expired gần nhất
      subscription = await PremiumSubscriptionModel.findOne({
        userId,
        $or: [
          { status: 'expired' },
          {
            status: 'cancelled',
            endDate: { $lte: new Date() }
          }
        ]
      }).sort({ endDate: -1 }); // Lấy subscription hết hạn gần đây nhất

      if (subscription) {
        return {
          premiumStatus: 'expired',
          endDate: subscription.endDate,
          subscription,
          autoRenew: false,
          message: 'Gói Premium đã hết hạn',
          canUseFeatures: false
        };
      }

      // Không tìm thấy subscription nào
      return { 
        premiumStatus: 'none', 
        message: 'Bạn chưa đăng ký gói Premium',
        canUseFeatures: false
      };

    } catch (error) {
      logger.error('Error checking subscription status:', error);
      throw new InternalServerErrorException('Kiểm tra trạng thái Premium thất bại');
    }
  }
}
