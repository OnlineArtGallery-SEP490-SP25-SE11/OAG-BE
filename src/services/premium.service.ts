import logger from '@/configs/logger.config';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@/exceptions/http-exception';
import  PremiumSubscriptionModel from '@/models/premium.model';
import User from '@/models/user.model';
import WalletService from '@/services/wallet.service';
import { inject, injectable } from 'inversify';
import cron from 'node-cron';

const PREMIUM_PRICE = 45000; // 45.000 VND cho một tháng
const PREMIUM_DESCRIPTION = 'Premium Subscription Monthly Fee';

@injectable()
export class PremiumService {
  constructor(
    @inject(Symbol.for('WalletService')) private walletService: WalletService,
    
  ) {}

  /**
   * Đăng ký premium cho người dùng
   * @param userId ID của người dùng
   * @returns Thông tin subscriptions
   */
  async subscribe(userId: string) {
    try {
      // Kiểm tra người dùng có tồn tại không
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Kiểm tra người dùng đã là premium chưa
      if (user.isPremium) {
        throw new BadRequestException('User already has a premium subscription');
      }

      // Thanh toán từ ví người dùng
      const paymentResult = await this.walletService.payment(
        userId,
        PREMIUM_PRICE,
        PREMIUM_DESCRIPTION
      );

      if (paymentResult.status === 'FAILED') {
        throw new BadRequestException(paymentResult.message || 'Payment failed');
      }

      // Tạo subscription
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Thêm 1 tháng

      const subscription = await PremiumSubscriptionModel.create({
        userId,
        startDate,
        endDate,
        status: 'active',
        orderCode: Date.now().toString()
      });

      // Cập nhật thông tin người dùng
      await User.findByIdAndUpdate(userId, {
        isPremium: true,
        premiumSince: startDate,
        premiumSubscription: subscription._id
      });

      // Lên lịch tự động gia hạn
      this.scheduleAutoRenewal(userId, subscription._id as string, endDate);

      // // Gửi thông báo
      // await this.notificationService.createNotification({
      //   title: 'Premium Subscription Activated',
      //   content: 'Your premium subscription has been activated successfully. Enjoy unlimited access to our premium features!',
      //   userId
      // });

      return subscription;
    } catch (error) {
      logger.error('Error subscribing to premium:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to subscribe to premium');
    }
  }

  /**
   * Hủy đăng ký premium cho người dùng
   * @param userId ID của người dùng
   * @returns Thông tin hủy đăng ký
   */
  async cancelSubscription(userId: string) {
    try {
      // Kiểm tra người dùng có tồn tại không và đang là premium
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      if (!user.isPremium && !user.premiumSubscription) {
        throw new BadRequestException('Người dùng không có đăng ký Premium đang hoạt động');
      }

      // Cập nhật trạng thái subscription thành cancelled, nhưng vẫn giữ nguyên thời gian endDate
      const subscription = await PremiumSubscriptionModel.findOneAndUpdate(
        { userId, status: 'active' },
        { status: 'cancelled' },
        { new: true }
      );

      if (!subscription) {
        throw new NotFoundException('Không tìm thấy đăng ký Premium đang hoạt động');
      }

      // Cập nhật isPremium thành false trong model User
      await User.findByIdAndUpdate(userId, { isPremium: false });
      
      return { 
        message: `Đăng ký Premium đã được hủy thành công. Bạn vẫn có thể sử dụng các tính năng Premium đến ${subscription.endDate.toLocaleDateString()}`, 
        subscription,
        isPremium: false
      };
    } catch (error) {
      logger.error('Error cancelling premium subscription:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi khi hủy đăng ký Premium');
    }
  }

  /**
   * Tự động gia hạn premium
   * @param userId ID của người dùng
   * @param subscriptionId ID của subscription
   * @returns Thông tin subscriptions mới
   */
  async autoRenew(userId: string, subscriptionId: string) {
    try {
      // Kiểm tra subscription
      const subscription = await PremiumSubscriptionModel.findById(subscriptionId);
      if (!subscription || subscription.userId.toString() !== userId) {
        throw new NotFoundException('Subscription not found');
      }

      // Kiểm tra trạng thái
      if (subscription.status !== 'active') {
        logger.info(`Skipping renewal for cancelled subscription: ${subscriptionId}`);
        return null;
      }

      // Thanh toán từ ví người dùng
      try {
        const paymentResult = await this.walletService.payment(
          userId,
          PREMIUM_PRICE,
          `${PREMIUM_DESCRIPTION} (Auto-renewal)`
        );

        if (paymentResult.status === 'FAILED') {
          // Cập nhật trạng thái subscription
          await PremiumSubscriptionModel.findByIdAndUpdate(subscriptionId, { status: 'expired' });
          
          // Cập nhật người dùng
          await User.findByIdAndUpdate(userId, { isPremium: false });
          
          // // Gửi thông báo cho người dùng
          // await this.notificationService.createNotification({
          //   title: 'Premium Subscription Expired',
          //   content: `We couldn't renew your premium subscription due to insufficient funds. Please add funds to your wallet and resubscribe.`,
          //   userId
          // });
          
          return null;
        }
        
        // Gia hạn thành công
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // Thêm 1 tháng
        
        // Tạo subscription mới
        const newSubscription = await PremiumSubscriptionModel.create({
          userId,
          startDate,
          endDate,
          status: 'active',
          orderCode: Date.now().toString()
        });
        
        // Cập nhật thông tin người dùng
        await User.findByIdAndUpdate(userId, {
          premiumSubscription: newSubscription._id
        });
        
        // Lên lịch tự động gia hạn cho lần tiếp theo
        this.scheduleAutoRenewal(userId, newSubscription._id as string, endDate);
        
        // Gửi thông báo
        // await this.notificationService.createNotification({
        //   title: 'Premium Subscription Renewed',
        //   content: 'Your premium subscription has been renewed for another month.',
        //   userId
        // });
        
        return newSubscription;
      } catch (error) {
        logger.error(`Payment error during auto-renewal for user ${userId}:`, error);
        
        // Cập nhật trạng thái subscription
        await PremiumSubscriptionModel.findByIdAndUpdate(subscriptionId, { status: 'expired' });
        
        // Cập nhật người dùng
        await User.findByIdAndUpdate(userId, { isPremium: false });
        
        // Gửi thông báo
        // await this.notificationService.createNotification({
        //   title: 'Premium Subscription Expired',
        //   content: 'We couldn\'t renew your premium subscription. Please check your wallet balance and resubscribe.',
        //   userId
        // });
        
        return null;
      }
    } catch (error) {
      logger.error('Error in auto-renewal process:', error);
      return null;
    }
  }

  /**
   * Kiểm tra và cập nhật trạng thái subscription
   * Chạy định kỳ để cập nhật trạng thái subscription đã hết hạn
   */
  async checkAndUpdateExpiredSubscriptions() {
    try {
      const now = new Date();
      
      // Tìm tất cả subscription đã hết hạn, bao gồm cả active và cancelled
      const expiredSubscriptions = await PremiumSubscriptionModel.find({
        endDate: { $lt: now },
        status: { $in: ['active', 'cancelled'] }
      });
      
      for (const subscription of expiredSubscriptions) {
        // Cập nhật trạng thái subscription
        await PremiumSubscriptionModel.findByIdAndUpdate(subscription._id, { status: 'expired' });
        
        // Cập nhật người dùng - đây là lúc thực sự đổi trạng thái isPremium
        await User.findByIdAndUpdate(subscription.userId, { isPremium: false });
        
        logger.info(`Cập nhật gói Premium hết hạn: ${subscription._id}`);
      }
      
      return { count: expiredSubscriptions.length };
    } catch (error) {
      logger.error('Lỗi khi kiểm tra gói Premium hết hạn:', error);
      return { count: 0 };
    }
  }

  /**
   * Thiết lập lịch tự động gia hạn
   * @param userId ID của người dùng
   * @param subscriptionId ID của subscription
   * @param endDate Ngày hết hạn
   */
  private scheduleAutoRenewal(userId: string, subscriptionId: string, endDate: Date) {
    // Lên lịch tự động gia hạn trước khi hết hạn 1 giờ
    const renewalTime = new Date(endDate.getTime() - 60 * 60 * 1000);
    
    // Sử dụng cron để lên lịch
    cron.schedule(
      `${renewalTime.getMinutes()} ${renewalTime.getHours()} ${renewalTime.getDate()} ${renewalTime.getMonth() + 1} *`,
      async () => {
        await this.autoRenew(userId, subscriptionId);
      },
      {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh"
      }
    );
    
    logger.info(`Scheduled auto-renewal for subscription ${subscriptionId} at ${renewalTime.toISOString()}`);
  }

  /**
   * Kiểm tra ràng buộc của người dùng dựa trên trạng thái premium
   * @param userId ID của người dùng
   * @param type Loại ràng buộc cần kiểm tra
   * @returns Thông tin về ràng buộc và có thể sử dụng hay không
   */
  async checkUserLimits(userId: string, type: 'gallery_views' | 'artists_follow' | 'collections') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPremium = user.isPremium;
      
      // Nếu người dùng đã hủy premium nhưng thời hạn chưa hết, kiểm tra subscription
      let hasActiveSubscription = false;
      if (!isPremium && user.premiumSubscription) {
        const subscription = await PremiumSubscriptionModel.findOne({
          _id: user.premiumSubscription,
          status: 'cancelled',
          endDate: { $gt: new Date() }
        });
        
        hasActiveSubscription = !!subscription;
      }
      
      // Giới hạn mặc định cho người dùng thường
      const limits = {
        gallery_views: { limit: 5, name: '3D Gallery Views', unlimited: false },
        artists_follow: { limit: 10, name: 'Artists You Can Follow', unlimited: false },
        collections: { limit: 1, name: 'Save Favorite Collections', unlimited: false }
      };
      
      // Nếu là premium HOẶC có subscription đã hủy nhưng còn hạn
      if (isPremium || hasActiveSubscription) {
        return {
          ...limits[type],
          unlimited: true,
          canUse: true,
          isPremium: isPremium,
          hasCancelledSubscription: hasActiveSubscription
        };
      }
      
      // Kiểm tra giới hạn dựa trên loại
      return {
        ...limits[type],
        unlimited: false,
        canUse: true, // Mặc định là true, sẽ được kiểm tra bởi service tương ứng
        isPremium: false,
        hasCancelledSubscription: false
      };
    } catch (error) {
      logger.error('Error checking user limits:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to check user limits');
    }
  }

  /**
   * Kiểm tra tình trạng đăng ký premium của người dùng
   * @param userId ID của người dùng
   * @returns Thông tin chi tiết về subscription và trạng thái
   */
  async checkSubscriptionStatus(userId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      // Kiểm tra subscription đã hủy nhưng còn hạn
      if (!user.isPremium && user.premiumSubscription) {
        const subscription = await PremiumSubscriptionModel.findOne({
          _id: user.premiumSubscription,
          status: 'cancelled',
          endDate: { $gt: new Date() }
        });

        if (subscription) {
          return {
            isPremium: false,
            hasCancelledSubscription: true,
            subscription,
            status: 'cancelled',
            endDate: subscription.endDate,
            message: `Bạn đã hủy gói Premium nhưng vẫn có thể sử dụng đến ${subscription.endDate.toLocaleDateString()}`
          };
        }
      }

      if (!user.isPremium) {
        return {
          isPremium: false,
          hasCancelledSubscription: false,
          message: 'Bạn chưa đăng ký gói Premium'
        };
      }

      // Nếu là premium, kiểm tra subscription
      const subscription = await PremiumSubscriptionModel.findOne({
        userId,
        status: { $in: ['active', 'cancelled'] }
      });

      if (!subscription) {
        return {
          isPremium: user.isPremium,
          hasCancelledSubscription: false,
          status: 'unknown',
          message: 'Bạn đang sử dụng gói Premium'
        };
      }

      return {
        isPremium: true,
        hasCancelledSubscription: false,
        status: subscription.status,
        endDate: subscription.endDate,
        subscription,
        message: subscription.status === 'cancelled'
          ? `Bạn đã hủy gói Premium. Vẫn có thể sử dụng đến ${subscription.endDate.toLocaleDateString()}`
          : `Bạn đang sử dụng gói Premium, sẽ tự động gia hạn vào ${subscription.endDate.toLocaleDateString()}`
      };
    } catch (error) {
      logger.error('Error checking subscription status:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi khi kiểm tra trạng thái Premium');
    }
  }
}
