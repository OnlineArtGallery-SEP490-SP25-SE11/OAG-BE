import { DocumentType, getModelForClass, modelOptions, prop, Severity } from "@typegoose/typegoose";


class Dimensions {
  @prop({ required: true, min: 0 })
  public xAxis!: number;

  @prop({ required: true, min: 0 })
  public yAxis!: number;

  @prop({ required: true, min: 0 })
  public zAxis!: number;
}


class CustomCollider {
  @prop({ required: true })
  public shape!: 'box' | 'curved';

  @prop({
    type: () => [Number],
    required: true,
    validate: {
      validator: (arr: number[]) => arr.length === 3,
      message: 'Args must have 3 values'
    }
  })
  public args!: number[];

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

@modelOptions({
  schemaOptions: { timestamps: true }, options: {
    allowMixed: Severity.ALLOW
  }
})
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

  @prop({ required: true, _id: false })
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

  @prop({ default: true })
  public isActive!: boolean;

  @prop({
    type: () => [CustomCollider],
    default: []
  })

  public customColliders?: CustomCollider[];

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