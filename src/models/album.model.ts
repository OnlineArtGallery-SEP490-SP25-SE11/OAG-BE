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
class Album {
    @prop({ ref: () => User, required: true, index: true })
    userId!: Ref<typeof User>;

    @prop({
        type: () => String,
        required: true
    })
    public title!: string;

    @prop({
        type: () => String,
        required: true
    })
    public category!: string;

    @prop({
        type: () => String,
        required: true
    })
    public description!: string;

    @prop({ ref: () => Artwork })
    public artworks?: Ref<typeof Artwork>[];
}

export default getModelForClass(Album, {
    schemaOptions: { timestamps: true }
});
