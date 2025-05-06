import mongoose, { Document, Schema, model, Types } from 'mongoose';
import { InteractionType } from "@/constants/enum";

// Define interface for Interaction document
interface IInteraction extends Document {
  type: InteractionType;
  userId: mongoose.Types.ObjectId;
  blogId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const interactionSchema = new Schema<IInteraction>(
  {
    type: {
      type: String,
      required: true,
      enum: Object.values(InteractionType),
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    blogId: {
      type: Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

// Create compound index
interactionSchema.index({ post: 1, type: 1, createdAt: -1 });
// Create and export the model
const Interaction = model<IInteraction>('Interaction', interactionSchema);

export default Interaction;

// Export the document type for type safety in other files
export type InteractionDocument = IInteraction & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};