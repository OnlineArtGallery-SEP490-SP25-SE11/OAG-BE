import { injectable } from 'inversify';
import { IInteractionService } from '@/interfaces/service.interface';
import { InteractionType } from '@/constants/enum';
import {
	InternalServerErrorException,
	BadRequestException
} from '@/exceptions/http-exception';
import interactionModel from '@/models/interaction.model';
import logger from '@/configs/logger.config';
import { Types } from 'mongoose';

@injectable()
export class InteractionService implements IInteractionService {
	constructor() {}

	getUserInteractions = async (
		userId: string,
		blogId: string
	): Promise<{
		hearted: boolean;
	}> => {
		try {
			if (!Types.ObjectId.isValid(blogId)) {
				throw new BadRequestException('Invalid blog ID format');
			}

			const hearted = await interactionModel.findOne({
				userId,
				blogId,
				type: InteractionType.HEART
			});
			return {
				hearted: !!hearted
			};
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw error;
			}
			logger.error(error, 'Error getting user interactions');
			throw new InternalServerErrorException(
				'Error getting user interactions'
			);
		}
	};
}
