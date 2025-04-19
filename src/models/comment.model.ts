// comment.model.ts
import {
  getModelForClass,
  modelOptions,
  prop,
  type Ref,
} from "@typegoose/typegoose";
import { Types } from "mongoose";
import User from "./user.model";

@modelOptions({ schemaOptions: { timestamps: true } })
export class Comment {
  // refPath để hỗ trợ nhiều loại nội dung (Blog, Artwork)
  @prop({ required: true, enum: ['blog', 'artwork'] })
  onModel!: string; // Tên model được comment (phải trùng với tên export default)

  @prop({ required: true, refPath: 'onModel', index: true })
  target!: Ref<any>; // target sẽ là Blog hoặc Artwork tùy vào onModel

  @prop({ ref: () => User, required: true, index: true })
  author!: Ref<typeof User>;

  @prop({ required: true, trim: true })
  content!: string;

  @prop({ default: 0 })
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

export default getModelForClass(Comment);
