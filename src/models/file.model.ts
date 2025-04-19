import { Document, Schema, model } from 'mongoose';

// Define interface for File document
interface IFile extends Document {
  publicId: string;
  url: string;
  refId?: string;
  refType?: string;
  width?: number;
  height?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const fileSchema = new Schema<IFile>(
  {
    publicId: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    refId: {
      type: String
      // TODO: fix any (from original comment)
    },
    refType: {
      type: String
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    }
  },
  { timestamps: true }
);

// Create index (empty in original but keeping for consistency)
fileSchema.index({});

// Create and export the model
const File = model<IFile>('File', fileSchema);

export default File;