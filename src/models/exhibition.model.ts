import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import User from "./user.model";
import Artwork from "./artwork.model";
import { type Ref } from "@typegoose/typegoose/lib/types";
import { GalleryStatus } from "@/constants/enum";

class LanguageOption {
    @prop({ required: true, trim: true, minlength: 2, maxlength: 2 })
    public name!: string;

    @prop({ required: true, trim: true, minlength: 2, maxlength: 2 })
    public code!: string;

    @prop({ required: true })
    public isDefault!: boolean;
}

class Result {
    @prop({ default: 0 })
    public visits?: number;

    @prop({ required: false })
    public likes?: {
        count: number;
        artworkId: string;
    }[];

    @prop({ default: 0 })
    public totalTime?: number;
}

class Public {
    @prop({ default: '' })
    public linkName?: string;

    @prop({ default: false })
    public discovery?: boolean;
}

class ArtWorkPosition {
	@prop({ ref: () => typeof Artwork, required: true })
	public artworkId!: string;

	@prop({ required: true })
	public positionIndex!: number;
}

@modelOptions({ schemaOptions: { timestamps: true } })
export class Exhibition {
    @prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
    public name!: string;

    @prop()
    public description?: string;

    @prop({ required: true })
    public startDate!: Date;

    @prop({ required: true })
    public endDate!: Date;

    @prop({ required: true })
    public artworks!: string[];

    @prop({ ref: () => User, required: true, index: true })
    author!: Ref<typeof User>;

    @prop({ required: true })
    languageOptions!: LanguageOption[];

    @prop({ default: false })
    isFeatured?: boolean;

    @prop({ required: true })
    status!: GalleryStatus;

    @prop({ required: true })
    result!: Result;

    @prop({ required: true })
    public!: Public;

    @prop({ required: true })
    artworkPositions!: ArtWorkPosition[];
}


export type ExhibitionDocument = Exhibition & {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
};

export default getModelForClass(Exhibition, { schemaOptions: { timestamps: true } });