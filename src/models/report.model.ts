import mongoose, { Document, Schema, model } from 'mongoose';
import { ReasonReport, ReportStatus } from '../constants/enum';

// Define interface for Report document
interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  refId: mongoose.Types.ObjectId;
  refType: 'BLOG' | 'ARTWORK' | 'USER' | 'COMMENT';
  reportedId: mongoose.Types.ObjectId;
  reason: string;
  description: string;
  status: string;
  url?: string;
  image?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const reportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    refId: {
      type: Schema.Types.ObjectId,
      refPath: 'refType',
      required: true
    },
    refType: {
      type: String,
      required: true,
      enum: ['BLOG', 'ARTWORK', 'USER', 'COMMENT']
    },
    reportedId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      enum: Object.values(ReasonReport),
      required: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      required: true,
      default: ReportStatus.PENDING
    },
    url: {
      type: String,
      required: false
    },
    image: {
      type: [String],
      required: false
    }
  },
  { timestamps: true }
);

// Create and export the model
const Report = model<IReport>('Report', reportSchema);

export default Report;