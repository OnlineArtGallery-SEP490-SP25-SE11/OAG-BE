// comment.model.ts
import { Document, Schema, model, Types } from 'mongoose';

// Define interface for Comment document
interface IComment extends Document {
  blog: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  likeCount?: number;
  parentComment?: Types.ObjectId;
  replies: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const commentSchema = new Schema<IComment>(
  {
    blog: {
      type: Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
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
      ref: 'Comment',
      required: false,
    },
    replies: {
      type: [Schema.Types.ObjectId],
      ref: 'Comment',
      default: []
    }
  },
  { timestamps: true }
);

// Create and export the model
const Comment = model<IComment>('Comment', commentSchema);

export default Comment;

// Export the document type for type safety in other files
export type CommentDocument = IComment & {
  _id: Types.ObjectId;
};