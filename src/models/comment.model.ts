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

  @prop({ ref: () => Comment })
  parentComment?: Ref<Comment>;

  @prop({ ref: () => Comment, default: [], type: () => [Types.ObjectId] })
  replies!: Types.ObjectId[];

  createdAt!: Date;
  updatedAt!: Date;
}

export type CommentDocument = Comment & {
  _id: Types.ObjectId;
};

export default getModelForClass(Comment);
