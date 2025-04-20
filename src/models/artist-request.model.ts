import mongoose, { Schema, Document } from 'mongoose';

export enum ArtistRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

export interface ArtistRequest extends Document {
    userId: mongoose.Types.ObjectId;
    status: ArtistRequestStatus;
    cccd?: string;
    //   artistCertificate?: string;
    rejectionReason?: string;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ArtistRequestSchema = new Schema<ArtistRequest>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: Object.values(ArtistRequestStatus),
            default: ArtistRequestStatus.PENDING
        },
        cccd: {
            type: Schema.Types.ObjectId,
            ref: 'CCCD',
            required: true
        },
        rejectionReason: {
            type: String
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

// Create index on userId for faster lookups and to ensure uniqueness
ArtistRequestSchema.index({ userId: 1 }, { unique: true });

const ArtistRequestModel = mongoose.model<ArtistRequest>('ArtistRequest', ArtistRequestSchema);
export default ArtistRequestModel;