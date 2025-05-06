import { Status } from "@/constants/enum";
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IBlog extends Document {
  title: string;
  content?: string;
  image: string;
  author: Types.ObjectId;
  status: Status;
  hearts: Types.ObjectId[];
  views?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface BlogModel extends Model<IBlog> {
  incrementHeartCount(postId: string): Promise<IBlog | null>;
  decrementHeartCount(postId: string): Promise<IBlog | null>;
}

const blogSchema = new Schema<IBlog, BlogModel>(
  {
    title: { type: String, required: true },
    content: { type: String, required: false },
    image: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { 
      type: String, 
      enum: Object.values(Status), 
      default: Status.DRAFT, 
      required: true,
      index: true 
    },
    hearts: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    views: { type: Number, default: 0 },
    tags: { type: [String], default: [], required: false }
  },
  { timestamps: true }
);

blogSchema.statics.incrementHeartCount = function(postId: string) {
  return this.findByIdAndUpdate(
    postId,
    { $inc: { heartCount: 1 } },
    { new: true }
  );
};

blogSchema.statics.decrementHeartCount = function(postId: string) {
  return this.findByIdAndUpdate(
    postId,
    { $inc: { heartCount: -1 } },
    { new: true }
  );
};

const Blog = mongoose.model<IBlog, BlogModel>('Blog', blogSchema);
export type BlogDocument = IBlog;
export default Blog;