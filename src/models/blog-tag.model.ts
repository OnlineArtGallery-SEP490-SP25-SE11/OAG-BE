import  { Document, Schema, model } from 'mongoose';

// Define interface for BlogTag document
interface IBlogTag extends Document {
  name: string;
}

// Create the schema
const blogTagSchema = new Schema<IBlogTag>({
  name: {
    type: String,
    required: true
  }
});

// Create and export the model
const BlogTag = model<IBlogTag>('BlogTag', blogTagSchema);
export type BlogTagDocument = IBlogTag
export default BlogTag;