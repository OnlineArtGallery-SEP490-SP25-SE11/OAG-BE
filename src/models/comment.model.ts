// comment.model.ts
import { getModelForClass, modelOptions, prop, type Ref } from "@typegoose/typegoose";
import { User } from "./user.model";
import { Blog } from "./blog.model";
import { Types } from "mongoose";

@modelOptions({ schemaOptions: { timestamps: true } })
export class Comment {
  @prop({ ref: () => Blog, required: true, index: true })
  blog!: Ref<Blog>;

  @prop({ ref: () => User, required: true, index: true })
  author!: Ref<User>;

  @prop({ required: true, trim: true })
  content!: string;

  @prop({ default: 0 })
  likeCount?: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export type CommentDocument = Comment & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export default getModelForClass(Comment, { schemaOptions: { timestamps: true } });