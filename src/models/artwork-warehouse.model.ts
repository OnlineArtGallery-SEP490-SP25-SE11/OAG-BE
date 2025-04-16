import {
	getModelForClass,
	index,
	modelOptions,
	prop,
	type Ref
} from '@typegoose/typegoose';
import User from './user.model';
import Artwork from './artwork.model';

@modelOptions({
	schemaOptions: {
		timestamps: true
	}
})
@index({ userId: 1 })
@index({ artworkId: 1 })
class ArtworkWarehouse {
	@prop({
		ref: () => User,
		required: true
	})
	public userId!: Ref<typeof User>;

	@prop({
		ref: () => Artwork,
		required: true
	})
	public artworkId!: Ref<typeof Artwork>;

	@prop({
		required: true,
		default: Date.now
	})
	public purchasedAt!: Date;

	@prop({
		type: () => Date
	})
	public downloadedAt?: Date;

	@prop({
		type: () => Number,
		default: 0
	})
	public downloadCount!: number;
}

export default getModelForClass(ArtworkWarehouse, {
	schemaOptions: { timestamps: true }
}); 