import Artwork from '@/models/artwork.model';
import {
	getModelForClass,
	modelOptions,
	prop,
	type Ref
} from '@typegoose/typegoose';

@modelOptions({
	schemaOptions: {
		timestamps: true
	}
})
class Collection {
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
