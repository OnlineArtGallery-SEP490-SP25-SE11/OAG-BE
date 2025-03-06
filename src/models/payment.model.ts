import { prop, getModelForClass } from '@typegoose/typegoose';

export class Payment {
    @prop({ required: true })
    public userId!: string;

    @prop({ required: true })
    public amount!: number;

    @prop()
    public description?: string;

    @prop({ required: true })
    public status!: 'PENDING' | 'PAID' | 'FAILED';

    @prop({ required: true })
    public paymentUrl!: string;

    @prop({ required: true })
    public orderCode!: string;

    @prop({ default: Date.now })
    public createdAt!: Date;

    @prop({ default: Date.now })
    public updatedAt!: Date;
}

export const PaymentModel = getModelForClass(Payment);