import {
	getModelForClass,
	index,
	modelOptions,
	prop,
	type Ref
} from '@typegoose/typegoose';
import User from './user.model';

class Dimensions {
	@prop({ required: true })
	public width!: number;

	@prop({ required: true })
	public height!: number;
}

@modelOptions({
	schemaOptions: {
		timestamps: true
	}
})
@index({ artistId: 1 })
@index({ title: 'text', description: 'text' })
class Artwork {
	@prop({
		type: () => String,
		required: true
	})
	public title!: string;

	@prop({
		type: () => String,
		required: true
	})
	public description!: string;

	@prop({
		type: () => [String],
		required: true
	})
	public category!: string[];

	@prop({
		type: () => Dimensions,
		required: true
	})
	public dimensions!: Dimensions;

	@prop({
		type: () => String,
		required: true
	})
	public url!: string;

	@prop({
		enum: ['available', 'sold', 'hidden', 'selling'],
		required: true
	})
	public status!: string; // enum 'available, sold, hidden, selling'

	@prop({
		type: () => Number,
		required: true,
		default: 0
	})
	public views?: number;

	@prop({
		type: () => Number,
		required: true,
		default: 0
	})
	public price?: number;

	@prop({
		ref: () => User,
		required: true
	})
	public artistId?: Ref<typeof User>;

	@prop({
		type: () => String,
		enum: ['pending', 'approved', 'rejected', 'suspended'],
		default: 'pending'
	})
	public moderationStatus!: string;

	@prop({
		type: () => String
	})
	public moderationReason?: string;

	@prop({
		type: () => String,
		enum: ['ai', 'admin', null]
	})
	public moderatedBy?: string;

	@prop({ type: () => Object, _id: false })
	public aiReview?: {
		keywords?: string[];
		suggestedCategories?: string[];
		description?: string;
		metadata?: Record<string, any>;
	};
}

export default getModelForClass(Artwork, {
	schemaOptions: { timestamps: true }
});
