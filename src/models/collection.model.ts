import mongoose, { Schema, Document, Types } from "mongoose";

// Define the interface for the document
export interface CollectionDocument extends Document {
  userId: Types.ObjectId;
  isArtist: boolean;
  title: string;
  description: string;
  artworks?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const CollectionSchema = new Schema<CollectionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    isArtist: {
      type: Boolean,
      required: true,
      default: false
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    artworks: {
      type: [Schema.Types.ObjectId],
      ref: 'Artwork'
    }
  },
  {
    timestamps: true
  }
);

// Create and export the model
const CollectionModel = mongoose.model<CollectionDocument>('Collection', CollectionSchema);
export default CollectionModel;