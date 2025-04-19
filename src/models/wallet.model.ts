import mongoose, { Document, Schema, model } from 'mongoose';

interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    balance: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { timestamps: true }
);

const Wallet = model<IWallet>('Wallet', walletSchema);

export default Wallet;