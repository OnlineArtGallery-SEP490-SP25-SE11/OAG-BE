import { getModelForClass, modelOptions, prop, type Ref } from '@typegoose/typegoose';
import Wallet from './wallet.model';

@modelOptions({
    schemaOptions: {
        timestamps: true
    }
})
class BankRequest {
    @prop({
        ref: () => Wallet,
        required: true
    })
    public walletId!: Ref<typeof Wallet>;

    @prop({
        type: () => Number,
        required: true
    })
    public amount!: number;

    @prop({
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        required: true,
        default: 'PENDING'
    })
    public status!: 'PENDING' | 'APPROVED' | 'REJECTED';

    @prop({
        type: () => String,
        required: true
    })
    public bankName!: string;

    @prop({
        type: () => String,
        required: true
    })
    public bankAccountName!: string;
}

export default getModelForClass(BankRequest, { schemaOptions: { timestamps: true } });