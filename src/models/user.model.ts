import {
	getModelForClass,
	index,
	modelOptions,
	pre,
	prop,
	type Ref
} from '@typegoose/typegoose';
import bcrypt from 'bcryptjs';
import { PremiumSubscriptionModel } from './premium.model';
// userSchema.pre("updateOne", async function (next) {
//   const update = this.getUpdate() as mongoose.UpdateQuery<IUser>;
//   if (!update) {
//     return next();
//   }
//   // check xem có cập nhật password không
//   if (update.password) {
//     const salt = await bcrypt.genSalt(10);
//     const hash = await bcrypt.hash(update.password, salt);
//     update.password = hash;
//   }
//   next();
// });
/* eslint-disable no-unused-vars */
type ProviderType = 'google' | 'facebook' | 'phone';
type RoleType = 'user' | 'admin' | 'artist';

class AvatarStyle {
	@prop({ default: false })
	hasCrown!: boolean;

	@prop({ default: false })
	hasSparklingBorder!: boolean;
}

@modelOptions({
	schemaOptions: {
		timestamps: true
	}
})
@index({ providerId: 1 }, { unique: true, sparse: true })
@index({ phone: 1 }, { unique: true, sparse: true })
@index({ email: 1 }, { unique: true, sparse: true })
@pre<User>('save', async function (next) {
	const user = this as User;
	if (user.password) {
		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(user.password, salt);
	}
	next();
})
@pre<User>('updateOne', async function (next) {
	const update = this.getChanges();
	if (!update) {
		return next();
	}
	if (update.password) {
		const salt = await bcrypt.genSalt(10);
		update.password = await bcrypt.hash(update.password, salt);
	}
	next();
})
class User {
	@prop({
		required: true,
		type: () => String,
		enum: ['google', 'facebook', 'phone'],
		validate: {
			validator: (value: string): value is ProviderType =>
				['google', 'facebook', 'phone'].includes(value),
			message: 'Please provide a valid provider (google, facebook, phone)'
		}
	})
	provider!: ProviderType;

	@prop({
		type: () => String,
		required: function (this: User) {
			return this.provider !== 'phone';
		}
	})
	providerId?: string;

	@prop({
		type: () => String,
		required: function (this: User) {
			return this.provider === 'phone';
		},
		match: [
			/^(0[35789])+([0-9]{8})$/,
			'Please provide a valid phone number (0xxxxxxxxx)'
		]
	})
	phone!: string;

	@prop({
		type: () => String,
		required: function (this: User) {
			return this.provider === 'phone';
		},
		select: false
	})
	password?: string;

	@prop({
		type: () => String,
		required: true
	})
	name!: string;

	@prop({
		type: () => String,
		required: function (this: User) {
			return this.provider !== 'phone';
		},
		match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
	})
	email!: string;

	@prop({
		type: () => String,
		match: [/^https?:\/\//, 'Please provide a valid URL for the image']
	})
	image?: string;

	@prop({
		type: () => String,
		enum: ['user', 'admin', 'artist'],
		required: true,
		default: ['user'],
		validate: {
			validator: (value: string[]) =>
				value.every((role) =>
					['user', 'admin', 'artist'].includes(role)
				),
			message: 'Please provide valid roles (user, admin, artist)'
		}
	})
	role!: RoleType[];

	@prop({ default: false })
	isPremium!: boolean;

	@prop()
	premiumSince?: Date;

	@prop({ type: () => AvatarStyle, default: () => ({}) })
	avatarStyle!: AvatarStyle;

	@prop({ ref: () => PremiumSubscriptionModel })
	premiumSubscription?: Ref<typeof PremiumSubscriptionModel>;

	@prop({ default: false })
	isBanned!: boolean;
}

export default getModelForClass(User, { schemaOptions: { timestamps: true } });
