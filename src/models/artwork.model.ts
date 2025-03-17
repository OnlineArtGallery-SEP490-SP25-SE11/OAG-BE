import { getModelForClass, index, modelOptions, prop, type Ref } from "@typegoose/typegoose";
import { User } from "./user.model";

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
export class Artwork {
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
        // required: true
    })
    public artistId?: Ref<User>;
}

export default getModelForClass(Artwork, {
    schemaOptions: { timestamps: true }
});