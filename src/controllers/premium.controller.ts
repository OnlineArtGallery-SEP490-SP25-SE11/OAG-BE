import { BadRequestException } from '@/exceptions/http-exception';
import { BaseHttpResponse } from '@/lib/base-http-response';
import { PremiumService } from '@/services/premium.service';
import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';

@injectable()
export class PremiumController {
  constructor(
    @inject(Symbol.for('PremiumService')) private premiumService: PremiumService
  ) {
    this.subscribe = this.subscribe.bind(this);
    this.cancelSubscription = this.cancelSubscription.bind(this);
    this.checkLimits = this.checkLimits.bind(this);
    this.checkStatus = this.checkStatus.bind(this);
  }

  /**
   * Đăng ký premium cho người dùng
   */
  async subscribe(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const subscription = await this.premiumService.subscribe(userId);
      
      const response = BaseHttpResponse.success(
        subscription,
        201,
        'Premium subscription activated successfully'
      );
      
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Hủy đăng ký premium cho người dùng
   */
  async cancelSubscription(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const result = await this.premiumService.cancelSubscription(userId);
      
      const response = BaseHttpResponse.success(
        result,
        200,
        'Premium subscription cancelled successfully'
      );
      
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Kiểm tra giới hạn người dùng dựa trên trạng thái premium
   */
  async checkLimits(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const { type } = req.params;
      if (!type || !['gallery_views', 'artists_follow', 'collections'].includes(type)) {
        throw new BadRequestException('Invalid limit type');
      }

      const limits = await this.premiumService.checkUserLimits(
        userId, 
        type as 'gallery_views' | 'artists_follow' | 'collections'
      );
      
      const response = BaseHttpResponse.success(
        limits,
        200,
        'User limits retrieved successfully'
      );
      
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Kiểm tra trạng thái premium của người dùng
   */
  async checkStatus(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new BadRequestException('Người dùng chưa đăng nhập');
      }

      const status = await this.premiumService.checkSubscriptionStatus(userId);
      
      const response = BaseHttpResponse.success(
        status,
        200,
        'Trạng thái Premium đã được kiểm tra'
      );
      
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

 