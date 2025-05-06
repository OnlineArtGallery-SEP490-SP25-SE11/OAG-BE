import mongoose, { Schema } from "mongoose";

const artworkWarehouseSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  artworkId: {
    type: Schema.Types.ObjectId,
    ref: 'Artwork',
    required: true
  },
  purchasedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  downloadedAt: {
    type: Date
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes
artworkWarehouseSchema.index({ userId: 1 });
artworkWarehouseSchema.index({ artworkId: 1 });

const ArtworkWarehouse = mongoose.model('ArtworkWarehouse', artworkWarehouseSchema);

export default ArtworkWarehouse;