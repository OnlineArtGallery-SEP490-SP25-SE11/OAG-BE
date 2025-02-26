import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { User } from './user.model';

class Participant {
  @prop({ ref: () => User, required: false})
  public userId!: User;

  @prop({ required: false })
  public role!: string; // "host", "artist", "attendee"

  @prop({ required: false })
  public joinedAt!: Date;
}

@modelOptions({ schemaOptions: { timestamps: true } })
export class Event{
    @prop({ required: true })
    title!: string;

    @prop()
    description!: string;

    @prop({ required: true })
    type!: string;

    @prop({ required: true })
    startDate!: Date;

    @prop({ required: true })
    endDate!: Date;

    @prop({ required: true })
    status!: string;

    @prop({ required: true })
    organizer?: string;

    @prop({ type: () => [Participant], required: false})
  public participants?: Participant[];
    @prop({  ref: () => User,required: true, index: true })
    userId!: User;
}

export default getModelForClass(Event, { schemaOptions: { timestamps: true } });
