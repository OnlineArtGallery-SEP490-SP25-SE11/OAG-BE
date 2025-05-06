// comment.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

// Define the interface for the document
export interface CommentDocument extends Document {
  onModel: 'blog' | 'artwork';
  target: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  likeCount: number;
  parentComment?: Types.ObjectId;
  replies: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const CommentSchema = new Schema<CommentDocument>(
  {
    // refPath to support multiple content types (Blog, Artwork)
    onModel: {
      type: String,
      required: true,
      enum: ['blog', 'artwork']
    },
    target: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'onModel',
      index: true
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    likeCount: {
      type: Number,
      default: 0
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    },
    replies: {
      type: [Schema.Types.ObjectId],
      ref: 'Comment',
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Create and export the model
const CommentModel = mongoose.model<CommentDocument>('Comment', CommentSchema);
export default CommentModel;