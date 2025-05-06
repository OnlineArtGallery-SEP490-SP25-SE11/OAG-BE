import mongoose, { Document, Schema, model } from 'mongoose';
import { EventStatus } from '../constants/enum';

// Define interfaces for nested types
interface IParticipant {
  userId?: mongoose.Types.ObjectId;
}

// Define main interface for Event document
interface IEvent extends Document {
  image: string;
  title: string;
  description: string;
  type: string;
  startDate: Date;
  endDate: Date;
  status: EventStatus;
  organizer: string;
  participants?: IParticipant[];
  userId: mongoose.Types.ObjectId;
  link?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create schema for nested Participant type
const participantSchema = new Schema<IParticipant>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: false });

// Create the main Event schema
const eventSchema = new Schema<IEvent>(
  {
    image: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    type: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      required: true,
      default: EventStatus.UPCOMING,
      index: true // Index for status filters
    },
    organizer: {
      type: String,
      required: true
    },
    participants: {
      type: [participantSchema]
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    link: {
      type: String,
      default: 'Updating'
    }
  },
  { timestamps: true }
);

// Add pre-save hook for status updates
eventSchema.pre('save', function(next) {
  const currentDate = new Date();
  
  // Check if startDate is today or in the past, but endDate is in the future
  if (this.startDate <= currentDate && this.endDate > currentDate) {
    this.status = EventStatus.ONGOING;
  }
  // Check if endDate is today or in the past
  else if (this.endDate <= currentDate) {
    this.status = EventStatus.COMPLETED;
  }
  // If both dates are in the future
  else {
    this.status = EventStatus.UPCOMING;
  }
  
  next();
});

// Create and export the model
const Event = model<IEvent>('Event', eventSchema);

export default Event;