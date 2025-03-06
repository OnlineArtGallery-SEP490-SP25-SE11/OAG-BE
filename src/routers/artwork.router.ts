import container from '@/configs/container.config';
import { TYPES } from '@/constants/types';
import { ArtworkController } from '@/controllers/artwork.controller';
import { Router } from 'express';
import { validate } from '@/middlewares/validate.middleware.ts';
import { artworkSchema } from '@/schemas/artwork.schema.ts';
import roleRequire from '@/configs/middleware.config.ts';
import { Role } from '@/constants/enum.ts';

const router = Router();
const artworkController = container.get<ArtworkController>(
	TYPES.ArtworkController
);
router.get('/', artworkController.get);
router.post(
	'/',
	roleRequire([Role.ARTIST]),
	validate(artworkSchema._def.schema),
	artworkController.add
);
router.get('/:id', artworkController.getById);
router.put('/:id', roleRequire([Role.ARTIST]), artworkController.update);
router.delete('/:id', roleRequire([Role.ARTIST]), artworkController.delete);
export default router;
