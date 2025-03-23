import { DocumentType, getModelForClass, index, modelOptions, prop, Severity } from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  },
  options: {
    allowMixed: Severity.ALLOW // Cho phép mixed types trong arrays
  }
})
@index({ name: 1 }) // Index cho field thường query
class Dimensions {
  @prop({ required: true, min: 0 })
  public xAxis!: number;

  @prop({ required: true, min: 0 })
  public yAxis!: number;

  @prop({ required: true, min: 0 })
  public zAxis!: number;
}

class ArtworkPlacement {
  @prop({ 
    type: () => [Number], 
    required: true,
    validate: {
      validator: (arr: number[]) => arr.length === 3,
      message: 'Position must have 3 coordinates'
    }
  })
  public position!: number[];

  @prop({ 
    type: () => [Number], 
    required: true,
    validate: {
      validator: (arr: number[]) => arr.length === 3,
      message: 'Rotation must have 3 angles'
    }
  })
  public rotation!: number[];
}

@modelOptions({ schemaOptions: { timestamps: true } })
export class Gallery {
  @prop({ 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50 
  })
  public name!: string;

  @prop()
  public description?: string;

  @prop({ required: true })
  public dimensions!: Dimensions;

  @prop({ required: true })
  public wallThickness!: number;

  @prop({ required: true })
  public wallHeight!: number;

  @prop({ required: true })
  public modelPath!: string;

  @prop({ required: true })
  public modelScale!: number;

  @prop({ type: () => [Number], default: [0, 0, 0] })
  public modelRotation!: number[];

  @prop({ type: () => [Number], default: [0, 0, 0] })
  public modelPosition!: number[];

  @prop()
  public previewImage!: string;

  @prop()
  public planImage!: string;

  @prop({ default: false })
  public isPremium!: boolean;

  @prop({ 
    type: () => [[Number]], 
    default: [],
    validate: {
      validator: (arr: number[][]) => arr.every(coord => coord.length === 3),
      message: 'Each collider must have 3 coordinates'
    }
  })

  public customColliders?: number[][];

  @prop({ 
    type: () => [ArtworkPlacement], 
    default: [],
    _id: false // Disable _id for subdocuments
  })
  public artworkPlacements!: ArtworkPlacement[];
}

// Export types
export type GalleryDocument = DocumentType<Gallery>;
export const GalleryModel = getModelForClass(Gallery);
export default GalleryModel;