import { getModelForClass, modelOptions, prop, type Ref } from '@typegoose/typegoose';
import User from './user.model';

@modelOptions({
    schemaOptions: {
        timestamps: true
    }
})
class Wallet {
    @prop({
        ref: () => User,
        required: true
    })
    public userId!: Ref<typeof User>;

    @prop({
        type: () => Number,
        required: true,
        default: 0
    })
    public balance!: number;
}

export default getModelForClass(Wallet, { schemaOptions: { timestamps: true } });