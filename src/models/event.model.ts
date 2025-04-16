import { getModelForClass, modelOptions, prop, type Ref, pre } from '@typegoose/typegoose';
import User from './user.model';
import { EventStatus } from '../constants/enum';

class Participant {
  @prop({ ref: () => User, required: false })
  public userId!: Ref<typeof User>;
}

@pre<Event>('save', function() {
  const currentDate = new Date();
  
  // Check if startDate is today or in the past, but endDate is in the future
  if (this.startDate <= currentDate && this.endDate > currentDate) {
    this.status = EventStatus.ONGOING;
  }
  // Check if endDate is today or in the past
  else if (this.endDate <= currentDate) {
    this.status = EventStatus.COMPLETED;
  }
  // If both dates are in the future
  else {
    this.status = EventStatus.UPCOMING;
  }
})
@modelOptions({
  schemaOptions: {
    timestamps: true
  }
})
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
  organizer!: string;
  
  @prop({ type: () => [Participant], required: false })
  public participants?: Participant[];
  
  @prop({ ref: () => User, required: true, index: true })
  userId!: Ref<typeof User>;
  
  @prop({ required: true })
  link!: string;
}

export default getModelForClass(Event, {
  schemaOptions: { timestamps: true }
});