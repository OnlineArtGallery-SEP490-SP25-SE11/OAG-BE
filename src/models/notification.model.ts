import User from '@/models/user.model.ts';
import { getModelForClass, index, prop, type Ref } from '@typegoose/typegoose';

@index({ userId: 1, createdAt: -1 })
@index({ isSystem: 1 })
@index({ isRead: 1 })class Notification {
    @prop({
        type: () => String,
        required: true
    })
    public title!: string;

    @prop({
        type: () => String,
        required: false
    })
    public content?: string;

    @prop({
        ref: () => User,
        required: true
    })
    public userId!: Ref<typeof User>;

    @prop({
        type: () => Boolean,
        default: false
    })
    public isRead!: boolean;

    @prop({
        type: () => Boolean,
        default: true  // Mặc định là true - tức là hệ thống tạo
    })
    public isSystem!: boolean;

    @prop({
        type: () => String,
        enum: ['system', 'announcement', 'marketing', 'feature', 'maintenance', 'artwork', 'event', 'chat', 'transaction'],
        default: 'system'
    })
    public refType?: string;

    @prop({
        type: () => String,
        required: false
    })
    public refId?: string;
}

export default getModelForClass(Notification, {
    schemaOptions: { timestamps: true }
});