import { getModelForClass, modelOptions, prop, DocumentType, type Ref, Severity, pre } from "@typegoose/typegoose";
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

    @prop({ trim: true, maxlength: 100, default: '' })
    public name!: string;

    @prop({ default: '' })
    public description!: string;
}

class Ticket {
    @prop({ required: true, default: false })
    public requiresPayment!: boolean;

    @prop({ 
        default: 0,
        validate: {
            validator: function(this: Ticket, price: number) {
                if (this.requiresPayment) {
                    return price > 0;
                }
                return true;
            },
            message: 'Price must be greater than 0 when payment is required'
        }
    })
    public price!: number;

    @prop({ ref: () => User, default: [] })
    public registeredUsers!: Ref<typeof User>[];
}

@modelOptions({
    options: {
        allowMixed: Severity.ALLOW
    },
    schemaOptions: {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
})
@pre<Exhibition>('validate', function() {
    if (this.endDate <= this.startDate) {
        throw new Error('End date must be after start date');
    }
})
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

    @prop({ type: () => Ticket, _id: false, required: true, default: () => ({}) })
    public ticket!: Ticket;


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