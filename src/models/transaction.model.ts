import { getModelForClass, modelOptions, prop, type Ref } from '@typegoose/typegoose';
import Wallet from './wallet.model';

@modelOptions({
    schemaOptions: {
        timestamps: true
    }
})
class Transaction {
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
        enum: ['DEPOSIT', 'WITHDRAWAL','PAYMENT'],
        required: true
    })
    public type!: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT';

    @prop({
        enum: ['PENDING', 'PAID', 'FAILED'],
        required: true,
        default: 'PENDING'
    })
    public status!: 'PENDING' | 'PAID' | 'FAILED';

    @prop({
        type: () => String,
        required: true
    })
    public orderCode!: string;
}

export default getModelForClass(Transaction, { schemaOptions: { timestamps: true } });