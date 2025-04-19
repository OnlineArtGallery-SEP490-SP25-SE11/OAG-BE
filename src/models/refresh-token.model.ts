import mongoose, { Document, Schema, model } from 'mongoose';

// Define interface for RefreshToken document
interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    token: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isRevoked: {
      type: Boolean,
      default: false
    }
  },
  { 
    timestamps: true,
    expires: '7d' // Automatically delete documents after 7 days based on createdAt
  }
);

// Create index on token field
refreshTokenSchema.index({ token: 1 }, { unique: true });

// Create and export the model
const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);

export default RefreshToken;