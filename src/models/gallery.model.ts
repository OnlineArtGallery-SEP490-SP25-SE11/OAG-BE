import { Document, Schema, model } from 'mongoose';

// Define interfaces for nested types
interface IDimensions {
  xAxis: number;
  yAxis: number;
  zAxis: number;
}

interface ICustomCollider {
  shape: 'box' | 'curved';
  args: number[];
  position: number[];
  rotation: number[];
}

interface IArtworkPlacement {
  position: number[];
  rotation: number[];
}

// Define main interface for Gallery document
interface IGallery extends Document {
  name: string;
  description?: string;
  dimensions: IDimensions;
  wallThickness: number;
  wallHeight: number;
  modelPath: string;
  modelScale: number;
  modelRotation: number[];
  modelPosition: number[];
  previewImage?: string;
  isPremium: boolean;
  isActive: boolean;
  // planImage?: string;
  customColliders?: ICustomCollider[];
  artworkPlacements: IArtworkPlacement[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Create schemas for nested documents
const dimensionsSchema = new Schema<IDimensions>({
  xAxis: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  yAxis: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  zAxis: { 
    type: Number, 
    required: true, 
    min: 0 
  }
}, { _id: false });

const customColliderSchema = new Schema<ICustomCollider>({
  shape: { 
    type: String, 
    required: true, 
    enum: ['box', 'curved'] 
  },
  args: {
    type: [Number],
    required: true,
    validate: {
      validator: (arr: number[]) => arr.length === 3,
      message: 'Args must have 3 values'
    }
  },
  position: {
    type: [Number],
    required: true,
    validate: {
      validator: (arr: number[]) => arr.length === 3,
      message: 'Position must have 3 coordinates'
    }
  },
  rotation: {
    type: [Number],
    required: true,
    validate: {
      validator: (arr: number[]) => arr.length === 3,
      message: 'Rotation must have 3 angles'
    }
  }
});

const artworkPlacementSchema = new Schema<IArtworkPlacement>({
  position: {
    type: [Number],
    required: true,
    validate: {
      validator: (arr: number[]) => arr.length === 3,
      message: 'Position must have 3 coordinates'
    }
  },
  rotation: {
    type: [Number],
    required: true,
    validate: {
      validator: (arr: number[]) => arr.length === 3,
      message: 'Rotation must have 3 angles'
    }
  }
}, { _id: false }); // Disable _id for subdocuments

// Create the main Gallery schema
const gallerySchema = new Schema<IGallery>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    description: {
      type: String
    },
    dimensions: {
      type: dimensionsSchema,
      required: true
    },
    wallThickness: {
      type: Number,
      required: true
    },
    wallHeight: {
      type: Number,
      required: true
    },
    modelPath: {
      type: String,
      required: true
    },
    modelScale: {
      type: Number,
      required: true
    },
    modelRotation: {
      type: [Number],
      default: [0, 0, 0]
    },
    modelPosition: {
      type: [Number],
      default: [0, 0, 0]
    },
    previewImage: {
      type: String
    },
    // planImage: {
    //   type: String
    // },
    isPremium: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    customColliders: {
      type: [customColliderSchema],
      default: []
    },
    artworkPlacements: {
      type: [artworkPlacementSchema],
      default: []
    }
  },
  { 
    timestamps: true,
    strict: false // Equivalent to allowMixed: Severity.ALLOW
  }
);

// Create and export the model
const Gallery = model<IGallery>('Gallery', gallerySchema);

// Export type for use in other files
export type GalleryDocument = IGallery;

export default Gallery;