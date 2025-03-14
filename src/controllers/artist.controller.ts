/* eslint-disable no-unused-vars */
import { BaseHttpResponse } from '@/lib/base-http-response';
import { ForbiddenException } from '@/exceptions/http-exception';
import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/constants/types';
import { IArtistController } from '@/interfaces/controller.interface';
import { ArtistService } from '@/services/artist.service';
import { ArtistProfileUpdate } from '@/interfaces/controller.interface';
import { BadRequestException } from '@/exceptions/http-exception';

@injectable()
export class ArtistController implements IArtistController {
    constructor(
        @inject(TYPES.ArtistService) private readonly _artistService: ArtistService
    ) {
        this.getProfile = this.getProfile.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
        this.getAllArtists = this.getAllArtists.bind(this);
        this.searchArtists = this.searchArtists.bind(this);
        this.editProfile = this.editProfile.bind(this);
        this.updateUserToArtist = this.updateUserToArtist.bind(this);
    }

    getProfile = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<any> => {
        try {
            const artistId = req.userId!;
            const artist = await this._artistService.getArtistProfile(artistId);

            const response = BaseHttpResponse.success(
                {
                    user: artist,
                },
                200,
                'Get artist profile success'
            );
            return res.status(response.statusCode).json(response.data);
        } catch (error) {
            next(error);
        }
    };

    updateProfile = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<any> => {
        try {
            const artistId = req.userId!;

            const updateData: ArtistProfileUpdate = {
                bio: req.body.bio,
                genre: req.body.genre,
               
            };

            const result = await this._artistService.updateArtistProfile(
                artistId,
                updateData
            );

            const response = BaseHttpResponse.success(
                result,
                200,
                'Update artist profile success'
            );
            return res.status(response.statusCode).json(response.data);
        } catch (error) {
            next(error);
        }
    };

    getAllArtists = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<any> => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await this._artistService.getAllArtists(page, limit);

            const response = BaseHttpResponse.success(
                result,
                200,
                'Get all artists success'
            );
            return res.status(response.statusCode).json(response.data);
        } catch (error) {
            next(error);
        }
    };

    searchArtists = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<any> => {
        try {
            const searchTerm = req.query.term as string;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await this._artistService.searchArtists(
                searchTerm,
                page,
                limit
            );

            const response = BaseHttpResponse.success(
                result,
                200,
                'Search artists success'
            );
            return res.status(response.statusCode).json(response.data);
        } catch (error) {
            next(error);
        }
    };

    editProfile = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<any> => {
        try {
            const userId = req.userId;
            const profileId = req.params.profileId;

            if (!userId) {
                throw new ForbiddenException('Forbidden');
            }

            const updateData: ArtistProfileUpdate = {
                bio: req.body.bio,
                genre: req.body.genre,


            };

            const updatedProfile = await this._artistService.editArtistProfile(
                userId,
                profileId,
                updateData
            );

            const response = BaseHttpResponse.success(
                updatedProfile,
                200,
                'Artist profile updated successfully'
            );
            return res.status(response.statusCode).json(response.data);
        } catch (error) {
            next(error);
        }
    };

    updateUserToArtist = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<any> => {
        try {
            const userId = req.params.userId;

            if (!userId) {
                throw new BadRequestException('User ID is required');
            }

            const result = await this._artistService.updateUserToArtist(userId);

            const response = BaseHttpResponse.success(
                result,
                200,
                'User updated to artist successfully'
            );
            return res.status(response.statusCode).json(response.data);
        } catch (error) {
            next(error);
        }
    };
} 