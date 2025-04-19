import mongoose, { Document, Schema, model } from 'mongoose';
import { ExhibitionStatus } from "@/constants/enum";

// Define interfaces for nested types
interface ILanguageOption {
  name: string;
  code: string;
  isDefault: boolean;
}

interface IResult {
  visits: number;
  likes?: {
    count: number;
    artworkId: string;
    userId: string;
  }[];
  totalTime: number; // minutes
}

interface IArtworkPosition {
  artwork: mongoose.Types.ObjectId;
  positionIndex: number;
}

interface IContent {
  languageCode: string;
  name: string;
  description: string;
}

interface ITicket {
  requiresPayment: boolean;
  price: number;
  registeredUsers: mongoose.Types.ObjectId[];
}

// Define main interface for Exhibition document
interface IExhibition extends Document {
  contents: IContent[];
  welcomeImage?: string;
  backgroundMedia?: string;
  backgroundAudio?: string;
  startDate: Date;
  endDate: Date;
  gallery: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  languageOptions: ILanguageOption[];
  isFeatured: boolean;
  status: ExhibitionStatus;
  result: IResult;
  linkName: string;
  discovery: boolean;
  artworkPositions: IArtworkPosition[];
  ticket: ITicket;
  getContent(languageCode: string): IContent | undefined;
  getDefaultContent(): IContent | undefined;
}

// Create schemas for nested documents
const languageOptionSchema = new Schema<ILanguageOption>({
  name: { 
    type: String, 
    required: true, 
    trim: true, 
    minlength: 2, 
    maxlength: 2 
  },
  code: { 
    type: String, 
    required: true,
    trim: true, 
    minlength: 2, 
    maxlength: 2 
  },
  isDefault: { 
    type: Boolean, 
    required: true 
  }
}, { _id: false });

const resultSchema = new Schema<IResult>({
  visits: { 
    type: Number, 
    default: 0 
  },
  likes: [{
    count: Number,
    artworkId: String,
    userId: String
  }],
  totalTime: { 
    type: Number, 
    default: 0 
  }
}, { _id: false });

const artworkPositionSchema = new Schema<IArtworkPosition>({
  artwork: { 
    type: Schema.Types.ObjectId, 
    ref: 'Artwork', 
    required: true 
  },
  positionIndex: { 
    type: Number, 
    required: true 
  }
}, { _id: false });

const contentSchema = new Schema<IContent>({
  languageCode: { 
    type: String, 
    required: true, 
    trim: true, 
    minlength: 2, 
    maxlength: 2 
  },
  name: { 
    type: String, 
    trim: true, 
    maxlength: 100, 
    default: '' 
  },
  description: { 
    type: String, 
    default: '' 
  }
}, { _id: false });

const ticketSchema = new Schema<ITicket>({
  requiresPayment: { 
    type: Boolean, 
    required: true, 
    default: false 
  },
  price: { 
    type: Number, 
    default: 0,
    validate: {
      validator: function(this: ITicket, price: number) {
        if (this.requiresPayment) {
          return price > 0;
        }
        return true;
      },
      message: 'Price must be greater than 0 when payment is required'
    }
  },
  registeredUsers: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    default: [] 
  }]
}, { _id: false });

// Create the main Exhibition schema
const exhibitionSchema = new Schema<IExhibition>(
  {
    contents: {
      type: [contentSchema],
      required: true,
      default: []
    },
    welcomeImage: String,
    backgroundMedia: String,
    backgroundAudio: String,
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    gallery: {
      type: Schema.Types.ObjectId,
      ref: 'Gallery',
      required: true,
      index: true
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    languageOptions: {
      type: [languageOptionSchema],
      required: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: Object.values(ExhibitionStatus),
      required: true,
      default: ExhibitionStatus.DRAFT,
      index: true // Index for status filters
    },
    result: {
      type: resultSchema,
      required: true,
      default: () => ({})
    },
    linkName: {
      type: String,
      default: ''
    },
    discovery: {
      type: Boolean,
      required: true,
      default: false
    },
    artworkPositions: {
      type: [artworkPositionSchema],
      required: true,
      default: []
    },
    ticket: {
      type: ticketSchema,
      required: true,
      default: () => ({})
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: false // Equivalent to allowMixed: Severity.ALLOW
  }
);

// Add pre-validate hook for date validation
exhibitionSchema.pre('validate', function(next) {
  if (this.endDate <= this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
  next();
});

// Add instance methods
exhibitionSchema.methods.getContent = function(languageCode: string) {
  return this.contents.find((content: IContent) => content.languageCode === languageCode);
};

exhibitionSchema.methods.getDefaultContent = function() {
  const defaultLang = this.languageOptions.find((lang: ILanguageOption) => lang.isDefault)?.code || 'en';
  return this.getContent(defaultLang);
};

// Create and export the model
const Exhibition = model<IExhibition>('Exhibition', exhibitionSchema);

// Export type for use in other files
export type ExhibitionDocument = IExhibition;

export default Exhibition;