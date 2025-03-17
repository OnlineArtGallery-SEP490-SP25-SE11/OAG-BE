import { prop, getModelForClass, type Ref } from '@typegoose/typegoose';
import  {User}  from './user.model';

class PremiumSubscription {
  @prop({ ref: 'User', required: true })
  userId!: Ref< User>;

  @prop({ required: true })
  startDate!: Date;

  @prop({ required: true })
  endDate!: Date;

  @prop({ required: true })
  status!: 'active' | 'expired' | 'cancelled';

  @prop()
  orderId?: string;

  @prop()
  paymentId?: string;
}

export const PremiumSubscriptionModel = getModelForClass(PremiumSubscription);