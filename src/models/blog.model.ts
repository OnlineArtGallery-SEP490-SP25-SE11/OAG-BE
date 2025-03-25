// import { Status } from "@/constants/enum";
// import { getModelForClass, modelOptions, prop, type Ref } from "@typegoose/typegoose";
// import { Types } from "mongoose";
// import User from "./user.model";

// @modelOptions({ schemaOptions: { timestamps: true } })
// export class Blog {
// 	@prop({ required: true })
// 	title!: string;

// 	@prop()
// 	content?: string;

// 	@prop({ required: true })
// 	image!: string;

// 	@prop({ ref: () => User, required: true, index: true })
// 	author!: Ref<typeof User>;

// 	@prop({
// 		required: true,
// 		type: String,
// 		enum: Status,
// 		default: Status.DRAFT,
// 		index: true // Index cho status filters
// 	})
// 	status!: Status;

// 	@prop({ default: 0 })
// 	heartCount?: number;

// 	@prop({ default: 0 })
// 	views?: number;

// 	@prop({ type: () => [String], default: [] })
// 	tags?: string[];

// 	static async incrementHeartCount(postId: string) {
// 		return getModelForClass(Blog).findByIdAndUpdate(
// 			postId,
// 			{ $inc: { heartCount: 1 } },
// 			{ new: true }
// 		);
// 	}

// 	static async decrementHeartCount(postId: string) {
// 		return getModelForClass(Blog).findByIdAndUpdate(
// 			postId,
// 			{ $inc: { heartCount: -1 } },
// 			{ new: true }
// 		);
// 	}
// }

// export type BlogDocument = Blog & {
// 	_id: Types.ObjectId;
// 	createdAt: Date;
// 	updatedAt: Date;
// };
// export default getModelForClass(Blog, { schemaOptions: { timestamps: true } });


import { Status } from "@/constants/enum";
import { getModelForClass, modelOptions, prop, type Ref } from "@typegoose/typegoose";
import { Types } from "mongoose";
import User from "./user.model";

@modelOptions({ schemaOptions: { timestamps: true } })
export class Blog {
	@prop({ required: true })
	title!: string;

	@prop()
	content?: string;

	@prop({ required: true })
	image!: string;

	@prop({ ref: () => User, required: true, index: true })
	author!: Ref<typeof User>;

	@prop({
		required: true,
		type: String,
		enum: Status,
		default: Status.DRAFT,
		index: true,
	})
	status!: Status;

	@prop({ type: () => [Types.ObjectId], ref: () => User, default: [] })
	hearts!: Types.ObjectId[];

	@prop({ default: 0 })
	views?: number;

	@prop({ type: () => [String], default: [] })
	tags?: string[];

	static async addHeart(postId: string, userId: string) {
		return getModelForClass(Blog).findByIdAndUpdate(
			postId,
			{ $addToSet: { hearts: userId } }, // Thêm userId nếu chưa tồn tại
			{ new: true }
		);
	}

	static async removeHeart(postId: string, userId: string) {
		return getModelForClass(Blog).findByIdAndUpdate(
			postId,
			{ $pull: { hearts: userId } }, // Xóa userId khỏi danh sách hearts
			{ new: true }
		);
	}
}

export type BlogDocument = Blog & {
	_id: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
};
export default getModelForClass(Blog, { schemaOptions: { timestamps: true } });
