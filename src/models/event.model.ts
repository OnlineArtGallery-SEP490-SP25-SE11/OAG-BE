import { getModelForClass, modelOptions, prop, type Ref } from '@typegoose/typegoose';
import User from './user.model';
import { EventStatus} from '../constants/enum';
class Participant {
  @prop({ ref: () => User, required: false })
  public userId!: Ref<typeof User>;
}



@modelOptions({ schemaOptions: { timestamps: true } })
class Event {
  @prop({ required: true })
  image!: string;

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

  @prop({
		required: true,
		type: String,
		enum: EventStatus,
		default: EventStatus.UPCOMING,
		index: true // Index cho status filters
	})
	status!: EventStatus;

  @prop({ required: true })
  organizer?: string;

  @prop({ type: () => [Participant], required: false })
  public participants?: Participant[];
  @prop({ ref: () => User, required: true, index: true })
  userId!: Ref<typeof User>;
}

export default getModelForClass(Event, { schemaOptions: { timestamps: true } });
