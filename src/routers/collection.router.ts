import { Router } from 'express';
import container from '@/configs/container.config.ts';
import { CollectionController } from '@/controllers/collection.controller.ts';
import { TYPES } from '@/constants/types.ts';

const router = Router()
const colleciontController = container.get<CollectionController>(TYPES.CollectionController)
router.post("/",colleciontController.add)
router.get("/", colleciontController.get)
router.put("/", colleciontController.update)
export default router;