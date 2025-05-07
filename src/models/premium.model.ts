import mongoose, { Document, Schema, model } from 'mongoose';

// Define status type for type safety
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' |'none';

// Define interface for PremiumSubscription document
export interface IPremiumSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  autoRenew: boolean;
  lastPaymentDate: Date;
  nextPaymentDate: Date;
  orderId?: string;
  paymentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const premiumSubscriptionSchema = new Schema<IPremiumSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'none'],
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    orderId: {
      type: String
    },
    paymentId: {
      type: String
    }
  },
  { timestamps: true }
);

// Middleware để tự động cập nhật trạng thái khi hết hạn
premiumSubscriptionSchema.pre('save', function(next) {
  const now = new Date();
  if (this.endDate < now && this.status !== 'cancelled') {
    this.status = 'expired';
  }
  next();
});

// Create and export the model
const PremiumSubscription = model<IPremiumSubscription>('PremiumSubscription', premiumSubscriptionSchema);

export default PremiumSubscription;