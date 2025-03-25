import { Router } from 'express';
import { ExhibitionController } from '@/controllers/exhibition.controller';
import { createEmptyExhibitionSchema, updateExhibitionSchema } from '@/dto/exhibition.dto';
import { Role } from '@/constants/enum';
import roleRequire from '@/configs/middleware.config';
import { validate } from '@/middlewares/validate.middleware';
import { TYPES } from '@/constants/types';
import container from '@/configs/container.config';

const router = Router();
const exhibitionController = container.get<ExhibitionController>(TYPES.ExhibitionController);

router.post(
  '/',
  roleRequire([Role.ARTIST,Role.ADMIN]), 
  validate(createEmptyExhibitionSchema),
  exhibitionController.create
);

router.get('/', exhibitionController.findAll);
router.get('/:id', exhibitionController.findById);

router.put(
  '/:id',
  roleRequire([Role.ADMIN, Role.ARTIST]), 
  validate(updateExhibitionSchema),
  exhibitionController.update
);

router.delete(
  '/:id',
  roleRequire([Role.ADMIN, Role.ARTIST]), 
  exhibitionController.delete
);

export default router;