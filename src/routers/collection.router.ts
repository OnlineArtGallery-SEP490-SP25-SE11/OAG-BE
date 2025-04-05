import { Router } from 'express';
import container from '@/configs/container.config.ts';
import { CollectionController } from '@/controllers/collection.controller.ts';
import { TYPES } from '@/constants/types.ts';
import roleRequire from '@/configs/middleware.config';
const router = Router();
const colleciontController = container.get<CollectionController>(
	TYPES.CollectionController
);
router.post('/', roleRequire(), colleciontController.add);
router.get('/', roleRequire(), colleciontController.getByUserId);
router.get('/other', roleRequire(), colleciontController.getByOtherUserId);
router.get('/:id', roleRequire(), colleciontController.getById);
router.put('/:id', roleRequire(), colleciontController.update);
router.delete('/delete-art/:id', roleRequire(), colleciontController.delArt);
router.delete('/delete-collection/:id', roleRequire(), colleciontController.delCollection);
export default router;
