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
    public visits!: number;

    @prop({ required: false })
    public likes!: {
        count: number;
        artworkId: string;
    }[];

    @prop({ default: 0 })
    public totalTime!: number; // minutes
}


class ArtWorkPosition {
    @prop({ ref: () => typeof Artwork, required: true })
    public artwork!: Ref<typeof Artwork>;

    @prop({ required: true })
    public positionIndex!: number;
}

class Content {
    @prop({ required: true, trim: true, minlength: 2, maxlength: 2 })
    public languageCode!: string;

    @prop({
        required: false,
        trim: true,
        maxlength: 100,
        default: '' 
    })
    public name!: string;

    @prop({
        required: false,
        default: '' 
    })
    public description!: string;
}

@modelOptions({
    options: {
        allowMixed: Severity.ALLOW
    }
})
@modelOptions({ schemaOptions: {} })
export class Exhibition {
    @prop({
        type: () => [Content],
        required: true,
        _id: false,
        default: []
    })
    public contents!: Content[];

    @prop({ required: true })
    public welcomeImage!: string;

    @prop({ required: false })
    public backgroundMedia?: string;

    @prop({ required: false })
    public backgroundAudio?: string;

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
    public isFeatured!: boolean;

    @prop({
        required: true, type: String,
        enum: ExhibitionStatus,
        default: ExhibitionStatus.DRAFT,
        index: true // Index cho status filters
    })
    public status!: ExhibitionStatus;

    @prop({ required: true, type: () => Result, _id: false })
    public result!: Result;

    @prop({ default: '' })
    public linkName!: string;

    @prop({ required: true, default: false })
    public discovery!: boolean;

    @prop({ required: true, type: () => [ArtWorkPosition], _id: false })
    public artworkPositions!: ArtWorkPosition[];

    public getContent(languageCode: string) {
        return this.contents.find(content => content.languageCode === languageCode);
    }

    public getDefaultContent() {
        const defaultLang = this.languageOptions.find(lang => lang.isDefault)?.code || 'en';
        return this.getContent(defaultLang);
    }
}


export type ExhibitionDocument = DocumentType<Exhibition>;

export default getModelForClass(Exhibition);