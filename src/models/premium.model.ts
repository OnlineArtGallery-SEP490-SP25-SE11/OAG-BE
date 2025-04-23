import mongoose, { Document, Schema, model } from 'mongoose';

// Define status type for type safety
type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

// Define interface for PremiumSubscription document
interface IPremiumSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
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
      enum: ['active', 'expired', 'cancelled'],
      required: true
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

// Create and export the model
const PremiumSubscription = model<IPremiumSubscription>('PremiumSubscription', premiumSubscriptionSchema);

export default PremiumSubscription;