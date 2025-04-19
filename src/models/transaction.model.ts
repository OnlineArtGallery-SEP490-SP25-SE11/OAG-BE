import mongoose, { Document, Schema, model } from 'mongoose';

// Define transaction types and status as type literals for type safety
type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'SALE' | 'COMMISSION' | 'PREMIUM_SUBSCRIPTION' | 'TICKET_SALE';
type TransactionStatus = 'PENDING' | 'PAID' | 'FAILED';

// Define interface for Transaction document
interface ITransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  orderCode: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const transactionSchema = new Schema<ITransaction>(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'SALE', 'COMMISSION', 'PREMIUM_SUBSCRIPTION', 'TICKET_SALE'],
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      required: true,
      default: 'PENDING'
    },
    orderCode: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

// Create and export the model
const Transaction = model<ITransaction>('Transaction', transactionSchema);

export default Transaction;