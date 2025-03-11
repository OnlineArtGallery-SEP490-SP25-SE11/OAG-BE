import { InteractionType } from "@/constants/enum";
import { getModelForClass, index, pre, prop, type Ref } from "@typegoose/typegoose";
import { Types } from "mongoose";
import { Blog } from "./blog.model";
import User from "./user.model";

@index({ post: 1, type: 1, createdAt: -1 })
@pre<Interaction>('save', async function (next) {
	if (this.type === InteractionType.HEART) {
		await Blog.incrementHeartCount(this.blogId.toString());
	}
	next();
})
@pre<Interaction>('deleteOne', async function (next) {
	if (this.type === InteractionType.HEART) {
		await Blog.decrementHeartCount(this.blogId.toString());
	}
	next();
})
export class Interaction {
	@prop({
		required: true,
		type: String,
		enum: InteractionType,
		index: true
	})
	type!: InteractionType;

	@prop({ required: true, ref: () => User, index: true })
	userId!: Ref<typeof User>;

	@prop({ required: true, ref: () => Blog, index: true })
	blogId!: Ref<Blog>;
}

export type InteractionDocument = Interaction & {
	_id: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
};
export default getModelForClass(Interaction);
