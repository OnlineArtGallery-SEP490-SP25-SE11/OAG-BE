import {
	getModelForClass,
	index,
	modelOptions,
	prop,
	type Ref
} from '@typegoose/typegoose';

@modelOptions({
	schemaOptions: {
		timestamps: true
	}
})
@index({})
class File {
	@prop({
		type: () => String,
		required: true
	})
	public publicId!: string;

	@prop({
		type: () => String,
		required: true
	})
	public url!: string;

	@prop({
		type: () => String
		// TODO: fix any
	})
	public refId?: Ref<any>;

	@prop({
		type: () => String
	})
	public refType?: string;
}

export default getModelForClass(File, {
	schemaOptions: { timestamps: true }
});
