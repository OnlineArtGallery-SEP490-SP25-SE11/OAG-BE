import { ForbiddenException } from '@/exceptions/http-exception';
import { NextFunction, Request, Response } from 'express';
import { ErrorCode } from '@/constants/error-code';
import { BaseHttpResponse } from '@/lib/base-http-response';
import { EventService } from '@/services/events.service';
import {
	UpdateEventDto,
	CreateEventPayload,
	UpdateEventSchema
} from '@/dto/event.dto';

export class EventController {
	constructor(private readonly _eventService: EventService) {
		this.getEvents = this.getEvents.bind(this);
		this.getEventById = this.getEventById.bind(this);
		this.createEvent = this.createEvent.bind(this);
		this.updateEvent = this.updateEvent.bind(this);
		this.deleteEvent = this.deleteEvent.bind(this);
	}

	async getEvents(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const events = await this._eventService.getEvents();
			const response = BaseHttpResponse.success(
				events,
				200,
				'Get events success'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	}



	async getEventById(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const event = await this._eventService.getEventById(req.params.id);
			const response = BaseHttpResponse.success(
				event,
				200,
				'Get event success'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	}


	async createEvent(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const userId = req.userId;
			if (!userId) {
				throw new ForbiddenException('Forbidden');
			}
			req.body.userId = userId;
			const validationResult = CreateEventPayload.safeParse(req.body);
			if (!validationResult.success) {
				const errors = validationResult.error.errors.map((error) => ({
					path: error.path.join('.'),
					message: error.message
				}));
				return res
					.status(400)
					.json(
						BaseHttpResponse.error(
							'Invalid event data',
							400,
							ErrorCode.VALIDATION_ERROR,
							errors
						)
					);
			}

			const eventData = { ...validationResult.data, userId };
			const event = await this._eventService.createEvent({
				...eventData,
				participants: eventData.participants || []
			});
			const response = BaseHttpResponse.success(
				event,
				201,
				'Create event success'
			);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	}

	async updateEvent(
		req: Request,
		res: Response,
		next: NextFunction): Promise<any> {
		try {
			const userId = req.userId;
			if (!userId) {
				throw new ForbiddenException('Forbidden');
			}
			req.body.userId = userId;
			const role = req.userRole!;
			const eventId = req.params.id;
			req.body._id = eventId;
			const validationResult = UpdateEventSchema.safeParse(req.body);
			if (!validationResult.success) {
				const errors = validationResult.error.errors.map((error) => ({
					path: error.path.join('.'),
					message: error.message
				}));
				return res
					.status(400)
					.json(
						BaseHttpResponse.error(
							'Invalid event data',
							400,
							ErrorCode.VALIDATION_ERROR,
							errors
						)
					);
			}
			const eventData: UpdateEventDto = validationResult.data;
			const updatedEvent = await this._eventService.updateEvent(eventData, role);
			const response = BaseHttpResponse.success(
				updatedEvent,
				200,
				'Update event success'
			);

			return res.status(response.statusCode).json(response.data);
		}
		catch (error) {
			next(error);
		}
	}


	async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<any> {
		const userId = req.userId;
		if (!userId) {
			throw new ForbiddenException('Forbidden');
		}
		const role = req.userRole!;
		const eventId = req.params.id;
		try {
			await this._eventService.deleteEvent(eventId, role);
			const response = BaseHttpResponse.success(null, 204, 'Delete event success');
			return res.status(response.statusCode).json(response.data);
		}
		catch (error) {
			next(error);
		}

	}
}
