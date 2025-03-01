import { getModelForClass, prop } from "@typegoose/typegoose";

export class BlogTag {
    @prop({ required: true })
    name!: string;
}

export default getModelForClass(BlogTag);
