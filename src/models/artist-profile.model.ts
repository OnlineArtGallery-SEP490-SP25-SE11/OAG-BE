import { prop, getModelForClass, type Ref, modelOptions } from '@typegoose/typegoose';
import { User } from './user.model';

@modelOptions({ schemaOptions: { timestamps: true } })

export class ArtistProfile {
    @prop({ ref: () => User, required: true })
    userId!: Ref<User>;

    @prop()
    bio!: string;

    @prop({ required: true })
    genre!: string[];

    @prop({ default: Date.now })
    createdAt!: Date;

    @prop({ default: Date.now })
    updatedAt!: Date;
}

export const ArtistProfileModel = getModelForClass(ArtistProfile);



