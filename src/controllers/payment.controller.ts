import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { PaymentService } from '@/services/payment.service';
import { CreatePaymentSchema, UpdatePaymentSchema } from '@/dto/payment.dto';
import { TYPES } from '@/types/payment.types';
import { UnauthorizedException, BadRequestException } from '@/exceptions/http-exception';
import PayOS from '@payos/node';
import { User } from '../models/user.model';
import { PremiumSubscriptionModel } from '../models/premium.model';
import logger from '@/configs/logger.config';

@injectable()
export class PaymentController {
  private static payOS = new PayOS(
    process.env.PAYOS_CLIENT_ID!,
    process.env.PAYOS_API_KEY!,
    process.env.PAYOS_CHECKSUM_KEY!
  );

  constructor(
    @inject(TYPES.PaymentService) private paymentService: PaymentService
  ) { }

  async createPayment(req: Request & { user?: { id: string } }, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      // Combine request body with userId
      const paymentData = {
        ...req.body,
        userId
      };

      const data = CreatePaymentSchema.parse(paymentData);
      const result = await this.paymentService.createPayment(data);
      res.json(result);
    } catch (error: any) {
      console.error('Error in createPayment:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: 'Invalid payment data',
          errors: error.errors
        });
      }
      res.status(500).json({
        message: 'Error creating payment',
        error: error.message
      });
    }
  }

  async verifyPayment(req: Request, res: Response) {
    try {
     
      return res.status(200).json({ success: true, paymentUrl: 'https://payos.com' });
    } catch (error: any) {
      logger.error('Error in verifyPayment:', error);
      if (error instanceof BadRequestException) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment'
      });
    }
  }

  async getPaymentHistory(req: Request & { user?: { id: string } }, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }
      const payments = await this.paymentService.getPaymentsByUserId(userId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async handleWebhook(req: Request, res: Response) {
    try {
      const data = UpdatePaymentSchema.parse(req.body);
      await this.paymentService.handleWebhook(data);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public static async createPaymentLink(req: Request, res: Response) {
    try {
      console.log('Received request body:', req.body);
      const { amount, orderDescription, orderType } = req.body;

      if (!amount || !orderDescription || !orderType) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const paymentLinkData = {
        orderCode: Date.now(),
        amount: 5000, // Ensure this is a number
        description: "Payment for the book",
        cancelUrl: `${process.env.CLIENT_URL}/payment/cancel`,
        returnUrl: `${process.env.CLIENT_URL}/payment/success`,
      };

      console.log('Payment link data:', paymentLinkData);

      const paymentLink = await this.payOS.createPaymentLink(paymentLinkData);

      console.log('Payment link created:', paymentLink);

      res.json({ paymentUrl: paymentLink.checkoutUrl });
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      if (error.response) {
        console.error('PayOS API response:', error.response.data);
      }
      res.status(500).json({
        message: 'Error creating payment link',
        error: error.message,
        details: error.response?.data || 'No additional details available'
      });
    }
  }

  public static async handlePayOSWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-payos-signature'] as string;
      const rawBody = JSON.stringify(req.body);

      // Since we can't verify the signature, we'll assume it's valid for now
      // In a production environment, you should implement proper signature verification
      console.warn('Webhook signature verification skipped. Implement this for production use.');

      const { data } = req.body;

      if (data.status === 'PAID') {
        // Payment successful, update your database here
        console.log('Payment successful for order:', data.orderCode);
        // TODO: Update order status in your database
      }

      res.json({ message: 'Webhook received' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ message: 'Error processing webhook' });
    }
  }

  public static async handlePaymentWebhook(req: Request, res: Response) {
    try {
      const { userId, status, orderId, paymentId } = req.body;

      if (status === 'success') {
        // Create premium subscription
        const subscription = await PremiumSubscriptionModel.create({
          userId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: 'active',
          orderId,
          paymentId
        });

        // Update user
        await User.findByIdAndUpdate(userId, {
          isPremium: true,
          premiumSubscription: subscription._id
        });

        return res.status(200).json({ success: true });
      }

      res.status(400).json({ success: false, message: 'Payment failed' });
    } catch (error) {
      console.error('Payment webhook error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}