import container from '@/configs/container.config';
import { TYPES } from '@/constants/types';
import { ArtworkController } from '@/controllers/artwork.controller';
import { Router } from 'express';
import { validate } from '@/middlewares/validate.middleware.ts';
import { artworkSchema } from '@/schemas/artwork.schema.ts';

const router = Router();
const artworkController = container.get<ArtworkController>(
	TYPES.ArtworkController
);
router.get('/', artworkController.get);
router.post('/', validate(artworkSchema._def.schema), artworkController.add);
router.get('/:id', artworkController.getById);
export default router;
