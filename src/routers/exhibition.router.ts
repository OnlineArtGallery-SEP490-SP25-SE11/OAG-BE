import { Router } from 'express';
import { ExhibitionController } from '@/controllers/exhibition.controller';
import { 
  createEmptyExhibitionSchema, 
  likeArtworkSchema, 
  rejectExhibitionSchema, 
  updateExhibitionSchema 
} from '@/dto/exhibition.dto';
import { Role } from '@/constants/enum';
import roleRequire from '@/configs/middleware.config';
import { validate } from '@/middlewares/validate.middleware';
import { TYPES } from '@/constants/types';
import container from '@/configs/container.config';
import { permanentBan } from '@/configs/middleware.config';
const router = Router();
const exhibitionController = container.get<ExhibitionController>(TYPES.ExhibitionController);

// Public Routes (No Authentication Required)
// -----------------------------------------
router.get('/public', exhibitionController.findPublishedExhibitions);
router.get('/public/link/:linkName', exhibitionController.findPublishedExhibitionByLinkName);

// User Routes (Authentication Required)
// -----------------------------------
router.post(
  '/:id/ticket/purchase', 
  roleRequire([Role.USER]), 
  exhibitionController.purchaseTicket
);

router.post(
  '/:id/artwork/like',
  roleRequire([Role.USER, Role.ARTIST, Role.ADMIN]),
  validate(likeArtworkSchema),
  exhibitionController.likeArtwork
);

// Artist Routes
// ------------
router.get(
  '/user-exhibitions', 
  roleRequire([Role.ARTIST, Role.ADMIN]), 
  exhibitionController.findUserExhibitions
);
router.get('/:id', roleRequire([Role.ARTIST, Role.ADMIN]), exhibitionController.findById);
router.post(
  '/',
  roleRequire([Role.ARTIST, Role.ADMIN]), 
  validate(createEmptyExhibitionSchema),
  permanentBan(),
  exhibitionController.create
);


router.patch(
  '/:id',
  roleRequire([Role.ARTIST, Role.ADMIN]), 
  validate(updateExhibitionSchema),
  exhibitionController.update
);

router.delete(
  '/:id',
  roleRequire([Role.ARTIST, Role.ADMIN]), 
  exhibitionController.delete
);

// Admin Routes
// -----------
router.get(
  '/', 
  roleRequire([Role.ADMIN]), 
  exhibitionController.findAll
);

router.patch(
  '/:id/approve',
  roleRequire([Role.ADMIN]),
  exhibitionController.approveExhibition
);

router.patch(
  '/:id/reject',
  roleRequire([Role.ADMIN]),
  validate(rejectExhibitionSchema),
  exhibitionController.rejectExhibition
);

export default router;