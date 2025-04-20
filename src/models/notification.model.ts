import mongoose, { Document, Schema, model } from 'mongoose';

// Define notification type for type safety
type NotificationType = 'system' | 'announcement' | 'marketing' | 'feature' | 'maintenance' | 'artwork' | 'event' | 'chat' | 'transaction' | 'artist-request';

// Define interface for Notification document
interface INotification extends Document {
  title: string;
  content?: string;
  userId: mongoose.Types.ObjectId;
  isRead: boolean;
  isSystem: boolean;
  refType?: NotificationType;
  refId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true
    },
    content: {
      type: String
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    isSystem: {
      type: Boolean,
      default: true // Default is true - means created by system
    },
    refType: {
      type: String,
      enum: ['system', 'announcement', 'marketing', 'feature', 'maintenance', 'artwork', 'event', 'chat', 'transaction', 'artist-request'],
      default: 'system'
    },
    refId: {
      type: String
    }
  },
  { timestamps: true }
);

// Create indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ isSystem: 1 });
notificationSchema.index({ isRead: 1 });

// Create and export the model
const Notification = model<INotification>('Notification', notificationSchema);

export default Notification;