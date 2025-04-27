import express, { Request, Response, NextFunction } from 'express';
import { ArtistController } from '@/controllers/artist.controller';
import roleRequire from '@/configs/middleware.config';
import { Role } from '@/constants/enum';
import { container } from '@/configs/inversify.config';
import { TYPES } from '@/constants/types';

const router = express.Router();
const artistController = container.get<ArtistController>(TYPES.ArtistController);

router.get(
    '/profile',
    roleRequire([Role.ARTIST]),
    async (req: Request, res: Response, next: NextFunction) => {
        await artistController.getProfile(req, res, next);
    }
);
router.get(
    '/featured',
    async (req: Request, res: Response, next: NextFunction) => {
        await artistController.getFeaturedArtist(req, res, next);
    }
);
router.get(
    '/trending',
    async (req: Request, res: Response, next: NextFunction) => {
        await artistController.getTrendingArtists(req, res, next);
    }
);

router.put(
    '/profile',
    roleRequire([Role.ARTIST]),
    async (req: Request, res: Response, next: NextFunction) => {
        await artistController.updateProfile(req, res, next);
    }
);

router.patch('/featured/:artistId', roleRequire([Role.ADMIN]), artistController.setFeaturedArtist);
router.put('/update-to-artist/:userId', roleRequire([Role.USER]), artistController.updateUserToArtist);
export default router;