import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const artistProfileSchema = Joi.object({
    bio: Joi.string(),
    genre: Joi.string(),
    socialLinks: Joi.array().items(
        Joi.string().pattern(/^https?:\/\//)
    ),
    careerStartDate: Joi.date(),
    achievements: Joi.array().items(Joi.string())
});

export const validateArtistProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await artistProfileSchema.validateAsync(req.body);
        next();
    } catch (err: any) {
        res.status(400).json({
            success: false,
            error: {
                message: err.message,
                code: 400
            }
        });
    }
}; 