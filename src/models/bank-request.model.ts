import mongoose, { Document, Schema } from 'mongoose';

// Define interface for the document
export interface IBankRequest extends Document {
  walletId: mongoose.Types.ObjectId;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  bankName: string;
  bankAccountName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create schema
const bankRequestSchema = new Schema({
  walletId: {
    type: Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    required: true,
    default: 'PENDING'
  },
  bankName: {
    type: String,
    required: true
  },
  bankAccountName: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Export model
export default mongoose.model<IBankRequest>('BankRequest', bankRequestSchema);