import Artwork from '@/models/artwork.model';
import {
	getModelForClass,
	modelOptions,
	prop,
	type Ref
} from '@typegoose/typegoose';
import User from './user.model';
@modelOptions({
	schemaOptions: {
		timestamps: true
	}
})
class Collection {
	@prop({ ref: () => User, required: true, index: true })
	userId!: Ref<typeof User>;

	@prop({
		type: () => Boolean,
		required: true,
		default: false
	})
	isArtist!: boolean;

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

	@prop({ ref: () => Artwork })
	public artworks?: Ref<typeof Artwork>[];
}

export default getModelForClass(Collection, {
	schemaOptions: { timestamps: true }
});
