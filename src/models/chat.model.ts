// chat.model.ts
import { getModelForClass, modelOptions, prop, type Ref } from "@typegoose/typegoose";
import UserModel  from "./user.model";
import { Types } from "mongoose";

@modelOptions({ schemaOptions: { timestamps: true } })
export class Chat {
  @prop({ ref: () => UserModel , required: true, index: true })
  sender!: Ref<typeof UserModel >;

  @prop({ ref: () => UserModel , required: true, index: true })
  receiver!: Ref<typeof UserModel >;

  @prop({ required: true, trim: true })
  message!: string;

  @prop({ default: false })
  isRead?: boolean;

  @prop({ default: [], type: () => [Types.ObjectId] })
  replyTo?: Types.ObjectId[];

  @prop({ default: () => [], type: () => [Types.ObjectId] })
  deletedBy!: Types.ObjectId[];

  @prop({ required: true })
  conversationId!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ChatDocument = Chat & {
  _id: Types.ObjectId;
};

export default getModelForClass(Chat);
