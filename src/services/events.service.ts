import logger from '@/configs/logger.config';
import { EventStatus } from '@/constants/enum';
import { ErrorCode } from '@/constants/error-code';
import { CouldNotFindBlogException } from '@/exceptions';
import {
	BadRequestException,
	InternalServerErrorException,
	UnauthorizedException
} from '@/exceptions/http-exception';
import Event from '@/models/event.model';
import User from '@/models/user.model';
import { FilterQuery, Types } from 'mongoose';
import NotificationService from '@/services/notification.service';
import { UpdateEventSchema } from '@/dto/event.dto';

export interface EventQueryOptions {
	title?: string;
	description?: string;
	type?: string;
	status?: EventStatus;
	organizer?: string;
	userId?: string;
	startDate?: Date;
	endDate?: Date;
	participants?: string[];
}




export class EventService {
	constructor() { }
	async getEvents() {
		try {
			const events = await Event.find();
			// console.log(events);
			return events;
		} catch (error) {
			logger.error(error, 'Error getting events');
			throw new InternalServerErrorException(
				'Error getting events from database',
				ErrorCode.DATABASE_ERROR
			);
		}
	}
	async getEventById(id: string): Promise<InstanceType<typeof Event> | null> {
		try {
			if (!Types.ObjectId.isValid(id)) {
				throw new BadRequestException(
					'Invalid event id',
					ErrorCode.INVALID_EVENT_ID
				);
			}
			const event = await Event.findById(id);
			if (!event) {
				throw new CouldNotFindBlogException();
			}
			return event;
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw error;
			}
			logger.error(error, 'Error getting event by id');
			throw new InternalServerErrorException(
				'Error getting event by id',
				ErrorCode.DATABASE_ERROR
			);
		}
	}
	async add(title: string, description: string, type: string, startDate: Date, endDate: Date,
		status: EventStatus, organizer: string, image: string, link: string='Updating',userId: string): Promise<InstanceType<typeof Event>> {
		try {
			const event = new Event({
				title,
				description,
				type,
				startDate,
				endDate,
				status: EventStatus.UPCOMING || status,
				organizer,
				image,
				link,
				userId,
			});
			console.log(event);
			return await event.save();
		} catch (error) {
			logger.error(error, 'Error adding event');
			throw new InternalServerErrorException(
				'Error adding event to database',
				ErrorCode.DATABASE_ERROR,
				error
			);
		}
	}

	async update(
		id: string,
		title?: string,
		description?: string,
		type?: string,
		startDate?: Date,
		endDate?: Date,
		status?: EventStatus,
		organizer?: string,
		image?: string,
		link?: string,
	): Promise<InstanceType<typeof Event>> {
		try {
			if (!Types.ObjectId.isValid(id)) {
				const errorMessage = 'Invalid event id';
				logger.error(errorMessage);
				throw new Error(errorMessage);
			}

			// Xây dựng object chứa các field cần cập nhật
			const updates: Partial<InstanceType<typeof Event>> = {
				title,
				description,
				type,
				startDate,
				endDate,
				status,
				organizer,
				image,
				link
			};

			// Loại bỏ các key có giá trị undefined, ép kiểu key
			(Object.keys(updates) as (keyof typeof updates)[]).forEach((key) => {
				if (updates[key] === undefined) {
					delete updates[key];
				}
			});

			// Cập nhật document bằng findOneAndUpdate và trả về document mới (new: true)
			const updatedEvent = await Event.findOneAndUpdate(
				{ _id: id },
				{ $set: updates },
				{ new: true, runValidators: true }
			);

			if (!updatedEvent) {
				const errorMessage = 'Event not found';
				logger.error(errorMessage);
				throw new Error(errorMessage);
			}
			const participants = updatedEvent.participants;
			if (participants && participants.length > 0) {
				const resolvedParticipation = await Promise.all(
				  participants.map(async (participant) => {
					// Extract the userId correctly from the participant object
					const userId = participant.userId as unknown as string;
					
					// Create a notification with relevant event update message
					return await NotificationService.createNotification({
					  title: 'Event Update',
					  content: `The event "${updatedEvent.title}" has been updated. Check the latest details.`,
					  userId: userId,
					  isSystem: true,
					  refType: 'event',
					  refId: id,
					});
				  })
				);
				
				// Log notification results if needed
				logger.info(`Sent notifications to ${resolvedParticipation.length} participants for event ${id}`);
			  }
			return updatedEvent;
		} catch (error) {
			logger.error(error, 'Error updating event');
			throw new InternalServerErrorException(
				'Error updating event in database',
				ErrorCode.DATABASE_ERROR,
				error
			);
		}
	}





	async deleteEvent(eventId: string, role: string[]): Promise<void> {
		try {
			const event = await Event.findById(eventId);

			if (!event) {
				throw new CouldNotFindBlogException();
			}

			if (!role.includes('admin')) {
				throw new UnauthorizedException(
					'You are not authorized to delete this event'
				);
			}

			await event.deleteOne();
		} catch (error) {
			if (
				error instanceof BadRequestException ||
				error instanceof UnauthorizedException
			) {
				throw error;
			}
			logger.error(error, 'Error deleting event');
			throw new InternalServerErrorException(
				'Error deleting event',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async get(options: EventQueryOptions, skip?: number, take?: number): Promise<{ events: InstanceType<typeof Event>[], total: number }> {
		try {
			const query: FilterQuery<Event> = { ...options };
			if (options.title) query.title = { $regex: options.title, $options: 'i' };
			if (options.description) query.description = { $regex: options.description, $options: 'i' };
			//if (options.type) query.type = { $regex: options.type, $options: 'i' };
			if (options.status) query.status = { $regex: options.status, $options: 'i' };
			if (options.organizer) query.organizer = { $regex: options.organizer, $options: 'i' };
			//if(options.userId) query.userId = {$regex: options.userId, $options: 'i'};
			//if(options.startDate) query.startDate = {$regex: options.startDate, $options: 'i'};
			//if(options.endDate) query.endDate = {$regex: options.endDate, $options: 'i'};
			let eventQuery = Event.find(query);
			if (skip && skip >= 0) eventQuery = eventQuery.skip(skip);
			if (take && take >= 0) eventQuery = eventQuery.limit(take);
			console.log(skip, take, options);
			const [events, total] = await Promise.all([
				eventQuery.exec(),
				Event.countDocuments(query)
			]);
			return { events, total };
		}
		catch (error) {
			logger.error(error, 'Error getting events');
			throw new InternalServerErrorException(
				'Error getting events from database',
				ErrorCode.DATABASE_ERROR,
				error
			);
		}
	}

	async participate(eventId: string, userId: string): Promise<InstanceType<typeof Event>> {
		try {
			// Tìm kiếm user theo id
			const user = await User.findById(userId);
			if (!user) throw new BadRequestException('User not found', ErrorCode.NOTFOUND);
			if (user.isBanned) throw new BadRequestException('User is banned', ErrorCode.USER_BANNED);
			
			// Lấy thông tin event
			const event = await Event.findById(eventId);
			if (!event) throw new BadRequestException('Event not found', ErrorCode.NOTFOUND);
			// Check if user is already in participants
			const isParticipating = event.participants?.some(
				participant => participant.userId as unknown as string === userId
			);
	
			// If already participating, throw error
			if (isParticipating) {
				throw new BadRequestException('User is already participating in this event');
			}
	
			// Add participant if not participating
			const updatedEvent = await Event.findByIdAndUpdate(
				eventId,
				{
					$addToSet: {
						participants: { userId: new Types.ObjectId(userId) }
					}
				},
				{ new: true }
			);
	
			if (!updatedEvent) {
				throw new CouldNotFindBlogException();
			}
	
			return updatedEvent;
		} catch (error) {
			// Kiểm tra loại lỗi và chuyển tiếp đúng loại lỗi
			if (error instanceof BadRequestException || 
				error instanceof CouldNotFindBlogException) {
				throw error;
			}
			
			logger.error(error, 'Error participating in event');
			throw new InternalServerErrorException(
				'Error participating in event',
				ErrorCode.DATABASE_ERROR
			);
		}
	}
	
	async cancelParticipation(eventId: string, userId: string): Promise<InstanceType<typeof Event>> {
		try {
			// Tìm kiếm user theo id
			const user = await User.findById(userId);
			if (!user) throw new BadRequestException('User not found', ErrorCode.NOTFOUND);
			if (user.isBanned) throw new BadRequestException('User is banned', ErrorCode.USER_BANNED);
			
			// Lấy thông tin event
			const event = await Event.findById(eventId);
			if (!event) throw new BadRequestException('Event not found', ErrorCode.NOTFOUND);
			console.log('participants', event.participants);
			
			// check if user is in array participants or not
			const isParticipating = event.participants && event.participants?.some(
				participant => participant.userId as unknown as string === userId
				
			);

			// If not participating, throw error
			// if (!isParticipating) {
			// 	throw new BadRequestException('User is not participating in this event');
			// }
			
			// Remove participant
			const updatedEvent = await Event.findByIdAndUpdate(
				eventId,
				{
					$pull: {
						participants: { userId: new Types.ObjectId(userId) }
					}
				},
				{ new: true }
			);
	
			if (!updatedEvent) {
				throw new CouldNotFindBlogException();
			}
	
			return updatedEvent;
		} catch (error) {
			// Kiểm tra loại lỗi và chuyển tiếp đúng loại lỗi
			if (error instanceof BadRequestException || 
				error instanceof CouldNotFindBlogException) {
				throw error;
			}
			
			logger.error(error, 'Error canceling participation in event');
			throw new InternalServerErrorException(
				'Error canceling participation in event',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async getUpcomingEvent(){
		try {
			const events = await Event.find({ status: EventStatus.UPCOMING });
			return events;
		} catch (error) {
			logger.error(error, 'Error getting upcoming events');
			throw new InternalServerErrorException(
				'Error getting upcoming events from database',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async getEventParticipated(userId: string): Promise<InstanceType<typeof Event>[]> {
		try {
		  // Validate userId
		  if (!Types.ObjectId.isValid(userId)) {
			throw new BadRequestException(
			  'Invalid user id',
			  ErrorCode.NOTFOUND
			);
		  }
		  
		  // Find events where the user's ID is in the participants array
		  const userEvents = await Event.find({
			'participants.userId': new Types.ObjectId(userId)
		  });
		  
		  return userEvents;
		} catch (error) {
		  // Handle specific error types
		  if (error instanceof BadRequestException) {
			throw error;
		  }
		  
		  logger.error(error, `Error fetching events participated by user ${userId}`);
		  throw new InternalServerErrorException(
			'Error fetching participated events from database',
			ErrorCode.DATABASE_ERROR
		  );
		}
	  }
}

