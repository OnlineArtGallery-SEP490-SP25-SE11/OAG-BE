import { Router } from 'express';
import { GalleryController } from '@/controllers/gallery.controller';
import { createGallerySchema, updateGallerySchema } from '@/dto/gallery.dto';
import { Role } from '@/constants/enum';
import roleRequire from '@/configs/middleware.config';
import { validate } from '@/middlewares/validate.middleware';
import { TYPES } from '@/constants/types';
import container from '@/configs/container.config';

const router = Router();
const galleryController = container.get<GalleryController>(TYPES.GalleryController);
router.post(
    '/',
    roleRequire([Role.ADMIN]),
    validate(createGallerySchema),
    galleryController.create
);
router.get('/', galleryController.findAll);
router.get('/:id', galleryController.findById);

router.put(
    '/:id',
    roleRequire([Role.ADMIN]),
    validate(updateGallerySchema),
    galleryController.update
);

router.delete(
    '/:id',
    roleRequire([Role.ADMIN]),
    galleryController.delete
);

export default router;