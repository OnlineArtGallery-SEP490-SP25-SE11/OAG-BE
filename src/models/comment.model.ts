// comment.model.ts 
//new pull
import { getModelForClass, modelOptions, prop, type Ref } from "@typegoose/typegoose";
import User from "./user.model";
import { Blog } from "./blog.model";
import { Types } from "mongoose";

@modelOptions({ schemaOptions: { timestamps: true } })
export class Comment {
  @prop({ ref: () => Blog, required: true, index: true })
  blog!: Ref<Blog>;

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