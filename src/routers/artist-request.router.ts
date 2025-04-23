import { Router } from 'express';
import { TYPES } from '@/constants/types';
import container from '@/configs/container.config';
import { ArtistRequestController } from '@/controllers/artist-request.controller';
import roleRequire from '@/configs/middleware.config';
import { Role } from '@/constants/enum';
import { validate } from '@/middlewares/validate.middleware';
import { CreateArtistRequestSchema, UpdateArtistRequestStatusSchema } from '@/dto/artist-request.dto';
import { permanentBan } from '@/configs/middleware.config';

const router = Router();
const artistRequestController = container.get<ArtistRequestController>(TYPES.ArtistRequestController);

// Route for users to submit artist request
router.post(
  '/',
  roleRequire([Role.USER]),
  validate(CreateArtistRequestSchema),
  permanentBan(),
  async (req, res, next) => {
      await artistRequestController.createRequest(req, res, next);
  }
);

router.get(
  '/',
  roleRequire([ Role.ADMIN]),
  async (req, res, next) => {
        await artistRequestController.getRequests(req, res, next);
    }
);
router.get(
  '/my-request',
  roleRequire([Role.USER, Role.ARTIST]),
  async (req, res, next) => {
        await artistRequestController.getMyRequest(req, res, next);
    }
);

router.get(
  '/:requestId',
  roleRequire([Role.ADMIN]),
  async (req, res, next) => {
        await artistRequestController.getRequestById(req, res, next);
    }
);

router.patch(
  '/:requestId/status',
  roleRequire([Role.ADMIN]),
  validate(UpdateArtistRequestStatusSchema),
  async (req, res, next) => {
      await artistRequestController.updateRequestStatus(req, res, next);
  }
);

router.get(
  '/my-request',
  roleRequire([Role.USER, Role.ARTIST]),
  async (req, res, next) => {
        await artistRequestController.getRequests(req, res, next);
    }
);

export default router;