import {User} from '@/models/user.model.ts';
import { getModelForClass, index, prop, type Ref } from '@typegoose/typegoose';

@index({ userId: 1, createdAt: -1 })
class Notification {
	@prop({
		type: () => String,
		required: true
	})
	public title!: string;

	@prop({
		type: () => String,
		required: false
	})
	public content?: string;

	@prop({
		ref: () => User,
		required: true
	})
	public userId!: Ref< User>;

	@prop({
		type: () => Boolean,
		default: false
	})
	public isRead!: boolean;
}

export default getModelForClass(Notification, {
	schemaOptions: { timestamps: true }
});
