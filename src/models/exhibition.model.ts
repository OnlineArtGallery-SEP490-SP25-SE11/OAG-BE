import { getModelForClass, modelOptions, prop, DocumentType, type Ref, Severity } from "@typegoose/typegoose";
import User from "./user.model";
import Artwork from "./artwork.model";
import { ExhibitionStatus } from "@/constants/enum";
import { Gallery } from "./gallery.model";
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
    public totalTime?: number; // minutes
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

@modelOptions({
    options: {
        allowMixed: Severity.ALLOW
    }
})
@modelOptions({ schemaOptions: {} })
export class Exhibition {
    @prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
    public name!: string;

    @prop()
    public description?: string;

    @prop({ required: true })
    public startDate!: Date;

    @prop({ required: true })
    public endDate!: Date;

    @prop({ ref: () => Gallery, required: true, index: true })
    public gallery!: Ref<Gallery>;

    @prop({ ref: () => User, required: true, index: true })
    public author!: Ref<typeof User>;

    @prop({ required: true })
    public languageOptions!: LanguageOption[];

    @prop({ default: false })
    public isFeatured?: boolean;

    @prop({
        required: true, type: String,
        enum: ExhibitionStatus,
        default: ExhibitionStatus.DRAFT,
        index: true // Index cho status filters
    })
    public status!: ExhibitionStatus;

    @prop({ required: true, type: () => Result, _id: false })
    public result!: Result;

    @prop({ required: true, type: () => Public, _id: false })
    public public!: Public;

    @prop({ required: true, type: () => [ArtWorkPosition], _id: false })
    public artworkPositions!: ArtWorkPosition[];
}


export type ExhibitionDocument = DocumentType<Exhibition>;

export default getModelForClass(Exhibition);