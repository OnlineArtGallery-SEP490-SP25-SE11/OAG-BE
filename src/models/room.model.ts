import { prop } from "@typegoose/typegoose";

class Room {
    @prop({ required: true })
    name!: string;

    @prop({ required: true })
    description!: string;

    @prop({ required: true })
    image!: string;

    @prop({ required: true })
    artworkNumber!: number;

    @prop({ required: true })
    map!: string;

}