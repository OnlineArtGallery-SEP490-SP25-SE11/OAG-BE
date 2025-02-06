import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { User } from './user.model';
import { Status } from '@/constants/enum';

@modelOptions({ schemaOptions: { timestamps: true } })
export class Blog {
	@prop({ required: true, default: false })
	published!: boolean;

	@prop({ required: true })
	title!: string;

	@prop()
	content?: string;

	@prop({ required: true })
	image!: string;

	@prop({ ref: () => User, required: true, index: true })
	userId!: User;

	@prop({
		required: true,
		type: String,
		enum: Status,
		default: Status.INACTIVE,
		index: true // Index cho status filters
	})
	status!: Status;

	@prop({ default: 0 })
	heartCount?: number;

	static async incrementHeartCount(postId: string) {
		return getModelForClass(Blog).findByIdAndUpdate(
			postId,
			{ $inc: { heartCount: 1 } },
			{ new: true }
		);
	}

	static async decrementHeartCount(postId: string) {
		return getModelForClass(Blog).findByIdAndUpdate(
			postId,
			{ $inc: { heartCount: -1 } },
			{ new: true }
		);
	}
}

export default getModelForClass(Blog, { schemaOptions: { timestamps: true } });
