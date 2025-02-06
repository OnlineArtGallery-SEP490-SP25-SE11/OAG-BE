import { InteractionType } from '@/constants/enum';
import { getModelForClass, index, pre, prop, Ref } from '@typegoose/typegoose';
import { User } from './user.model';
import { Blog } from './blog.model';

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
	userId!: Ref<User>;

	@prop({ required: true, ref: () => Blog, index: true })
	blogId!: Ref<Blog>;
}

export default getModelForClass(Interaction);
