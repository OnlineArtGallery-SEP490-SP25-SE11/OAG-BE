import { getModelForClass, modelOptions, prop, type Ref } from '@typegoose/typegoose';
import User from './user.model';

@modelOptions({
    schemaOptions: {
        timestamps: true
    }
})
class Payment {
    @prop({
        ref: () => User,
        required: true
    })
    public userId!: Ref<typeof User>;

    @prop({
        type: () => Number,
        required: true
    })
    public amount!: number;

    @prop({
        type: () => String,
        required: false
    }
    )
    public description?: string;

    @prop({
        enum: ['PENDING', 'PAID', 'FAILED'],
        required: true
    })
    public status!: 'PENDING' | 'PAID' | 'FAILED';

    @prop({
        type: () => String,
        required: true
    })
    public paymentUrl!: string;

    @prop({
        type: () => String,
        required: true
    })
    public orderCode!: string;

}

export default getModelForClass(Payment,
    { schemaOptions: { timestamps: true } }
);