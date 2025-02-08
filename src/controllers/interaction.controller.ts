import { IInteractionController } from "@/interfaces/controller.interface";
import { NextFunction, Request, Response } from "express";
import { BadRequestException } from "@/exceptions/http-exception";
import { BaseHttpResponse } from "@/lib/base-http-response";
import { InteractionService } from "@/services/interaction.service";
import { inject, injectable } from "inversify";
import { TYPES } from "@/constants/types";

@injectable()
export class InteractionController implements IInteractionController {
  constructor(@inject(TYPES.InteractionService) private readonly _interactionService: InteractionService) {}

  getUserInteractions = async (req: Request, res: Response, next: NextFunction) : Promise<any> => {
    try {
      const userId = req.userId;
      const blogId = req.params.blogId;
      console.log(userId, blogId);
      if (!userId || !blogId) {
        throw new BadRequestException("Invalid request");
      }
		const interactions = await this._interactionService.getUserInteractions(
			userId,
			blogId
		);
		const response = BaseHttpResponse.success(
			interactions,
			200,
			'Get user interactions success'
		);
		console.log(response);
			return res.status(response.statusCode).json(response.data);
		} catch (error) {
			next(error);
		}
	};
}
