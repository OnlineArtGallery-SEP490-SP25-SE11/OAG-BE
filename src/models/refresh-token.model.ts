import User from '@/models/user.model';
import type { Ref } from '@typegoose/typegoose'; // Import the Ref type
import {
	getModelForClass,
	index,
	modelOptions,
	prop
} from '@typegoose/typegoose';
@modelOptions({
	schemaOptions: {
		timestamps: true, // Tự động tạo createdAt và updatedAt
		expires: '7d' // Tự động xóa sau 7 ngày dựa trên createdAt
	}
})
@index({ token: 1 }, { unique: true })
export class RefreshToken {
	@prop({ ref: () => User })
	userId!: Ref<typeof User>;

	@prop({
		required: true,
		type: () => String
	})
	token!: string;

	@prop({
		required: true,
		type: () => Date
	})
	expiresAt!: Date;

	@prop({
		default: false,
		type: () => Boolean
	})
	isRevoked!: boolean;
}

export default getModelForClass(RefreshToken, {
	schemaOptions: {
		timestamps: true,
		expires: '7d'
	}
});
