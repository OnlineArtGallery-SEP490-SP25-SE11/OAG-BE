import mongoose, { Document, Schema, model } from 'mongoose';

// Define interface for ArtistProfile document
interface IArtistProfile extends Document {
  userId: mongoose.Types.ObjectId;
  bio: string;
  genre: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const artistProfileSchema = new Schema<IArtistProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bio: {
      type: String
    },
    genre: {
      type: [String],
      required: true
    }
  },
  { timestamps: true }
);

// Create and export the model
const ArtistProfile = model<IArtistProfile>('ArtistProfile', artistProfileSchema);

export default ArtistProfile;