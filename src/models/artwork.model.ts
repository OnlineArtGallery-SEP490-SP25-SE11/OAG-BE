import mongoose, { Document, Schema } from 'mongoose';

// Define interfaces for the document
export interface IDimensions {
  width: number;
  height: number;
}

export interface IArtwork extends Document {
  title: string;
  description: string;
  category: string[];
  dimensions: IDimensions;
  url: string;
  status: string;
  views?: number;
  price?: number;
  artistId?: mongoose.Types.ObjectId;
  moderationStatus: string;
  moderationReason?: string;
  moderatedBy?: string;
  aiReview?: {
    keywords?: string[];
    suggestedCategories?: string[];
    description?: string;
    metadata?: Record<string, any>;
  };
  buyers?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Create dimensions schema
const dimensionsSchema = new Schema({
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  }
}, { _id: false });

// Create artwork schema
const artworkSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: [String],
    required: true
  },
  dimensions: {
    type: dimensionsSchema,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'hidden', 'selling'],
    required: true
  },
  views: {
    type: Number,
    required: true,
    default: 0
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  artistId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  moderationReason: {
    type: String
  },
  moderatedBy: {
    type: String,
    enum: ['ai', 'admin', null]
  },
  aiReview: {
    keywords: [String],
    suggestedCategories: [String],
    description: String,
    metadata: Schema.Types.Mixed
  },
  buyers: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Create indexes
artworkSchema.index({ artistId: 1 });
artworkSchema.index({ title: 'text', description: 'text' });

// Create and export model
export default mongoose.model<IArtwork>('Artwork', artworkSchema);