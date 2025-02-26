import logger from '@/configs/logger.config';
import { ErrorCode } from '@/constants/error-code';
import { CouldNotFindBlogException } from '@/exceptions';
import {
	BadRequestException,
	InternalServerErrorException,
	UnauthorizedException
} from '@/exceptions/http-exception';
import { Types } from 'mongoose';
import EventModel, {Event } from '@/models/event.model';
import { CreateEventDto, UpdateEventDto } from '@/dto/event.dto';
import e from 'express';
export class EventService {
	constructor() {}
	async getEvents() {
		try {
			const events = await EventModel.find();
			return events;
		} catch (error) {
			logger.error(error, 'Error getting events');
			throw new InternalServerErrorException(
				'Error getting events from database',
				ErrorCode.DATABASE_ERROR
			);
		}
	}
	async getEventById(id: string): Promise<Event | null> {
		try {
			if (!Types.ObjectId.isValid(id)) {
				throw new BadRequestException(
					'Invalid event id',
					ErrorCode.INVALID_EVENT_ID
				);
			}
			const event = await EventModel.findById(id);
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
	async createEvent(data: CreateEventDto): Promise<Event> {
		try {
			const event = new EventModel({
				title: data.title,
				description: data.description,
				type: data.type,
				status: data.status,
				organizer: data.organizer,
				userId: new Types.ObjectId(data.userId),
				startDate: data.startDate,
				endDate: data.endDate,
				participants: data.participants
			});
			logger.info('Event created successfully', event);
			const newEvent = await event.save();
			return newEvent;
		} catch (error) {
			logger.error(error, 'Error creating event');
			throw new InternalServerErrorException(
				'Error creating event',
				ErrorCode.DATABASE_ERROR,
				error
			);
		}
	}
	async updateEvent(
		data: UpdateEventDto,
		role: string[]
	): Promise<Event | null> {
		try {
			const event = await EventModel.findById(data._id);
			if (!event) {
				throw new CouldNotFindBlogException();
			}
			if (!role.includes('admin')) {
				throw new UnauthorizedException(
					'You are not authorized to update this event'
				);
			}
			const updatedEvent = await EventModel.findByIdAndUpdate(
				data._id,
				{
					title: data.title,
					description: data.description,
					type: data.type,
					status: data.status,
					organizer: data.organizer,
					userId: new Types.ObjectId(data.userId)
				},
				{ new: true }
			);

			if (!updatedEvent) {
				throw new BadRequestException(
					'Invalid event data',
					ErrorCode.INVALID_EVENT_ID
				);
			}

			return updatedEvent;
		} catch (error) {
			if (
				error instanceof BadRequestException ||
				error instanceof UnauthorizedException
			) {
				throw error;
			}
			logger.error(error, 'Error updating event');
			throw new InternalServerErrorException(
				'Error updating event',
				ErrorCode.DATABASE_ERROR,
				error
			);
		}
	}

	async deleteEvent(eventId: string, role: string[]): Promise<void> {
		try {
			const event = await EventModel.findById(eventId);

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
}
