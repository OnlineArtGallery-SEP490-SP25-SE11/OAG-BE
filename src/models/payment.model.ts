import mongoose, { Document, Schema, model } from 'mongoose';

// Define payment status type for type safety
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

// Define interface for Payment document
interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  description?: string;
  status: PaymentStatus;
  paymentUrl: string;
  orderCode: string;
  createdAt?: Date;
  updatedAt?: Date;
  getId(): string;
}

// Create the schema
const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      required: true
    },
    paymentUrl: {
      type: String,
      required: true
    },
    orderCode: {
      type: String,
      required: true
    }
  },
  { 
    timestamps: true,
    id: true 
  }
);

// Add instance method
paymentSchema.methods.getId = function(): string {
  return this._id?.toString();
};

// Create and export the model
const Payment = model<IPayment>('Payment', paymentSchema);

export default Payment;