import mongoose, { Document, Schema, model, Types } from 'mongoose';
import { Role } from '@/constants/enum';


// Define provider type for type safety
type ProviderType = 'google' | 'facebook' | 'phone';

// Define interface for User document
interface IUser extends Document {
  provider: ProviderType;
  providerId?: string;
  phone: string;
  password?: string;
  name: string;
  email: string;
  image?: string;
  role: Role[];
  premiumStatus: mongoose.Types.ObjectId;
  isBanned: boolean;
  isRequestBecomeArtist: boolean;
  artistProfile?: {
    bio?: string;
    genre?: string[];
    experience?: string;
    socialLinks?: {
      instagram?: string;
      twitter?: string;
      website?: string;
    };
  };
  following: Types.ObjectId[];
  followers: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
  isFeatured?: boolean;
}

// Create the user schema
const userSchema = new Schema<IUser>(
  {
    provider: {
      type: String,
      required: true,
      enum: ['google', 'facebook', 'phone'],
      validate: {
        validator: (value: string): value is ProviderType =>
          ['google', 'facebook', 'phone'].includes(value),
        message: 'Please provide a valid provider (google, facebook, phone)'
      }
    },
    providerId: {
      type: String,
      required: function (this: IUser) {
        return this.provider !== 'phone';
      }
    },
    phone: {
      type: String,
      required: function (this: IUser) {
        return this.provider === 'phone';
      },
      match: [/^(0[35789])+([0-9]{8})$/, 'Please provide a valid phone number (0xxxxxxxxx)']
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return this.provider === 'phone';
      },
      select: false
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: function (this: IUser) {
        return this.provider !== 'phone';
      },
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    image: {
      type: String,
      match: [/^https?:\/\//, 'Please provide a valid URL for the image']
    },
    role: {
      type: [String],
      enum: Object.values(Role),
      required: true,
      default: [Role.USER],
      validate: {
        validator: (value: string[]) =>
          value.every((role) => Object.values(Role).includes(role as Role)),
        message: `Please provide valid roles (${Object.values(Role).join(', ')})`
      }
    },
    premiumStatus: {
      type: Schema.Types.ObjectId,
      ref: 'PremiumSubscription'
    },
    isBanned: {
      type: Boolean,
      default: false
    },
    artistProfile: {
      bio: String,
      genre: [String],
      experience: String,
      socialLinks: {
        instagram: String,
        twitter: String,
        website: String
      }
    },
    following: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: []
    },
    followers: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: []
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);
// Create and export the model
const User = model<IUser>('User', userSchema);

export default User;
