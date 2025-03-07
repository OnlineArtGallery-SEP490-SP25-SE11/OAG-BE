import container from '@/configs/container.config';
import roleRequire from '@/configs/middleware.config';
import { TYPES } from '@/constants/types';
import { InteractionController } from '@/controllers/interaction.controller';
import { Router } from 'express';
const router = Router();
const interactionController = container.get<InteractionController>(
	TYPES.InteractionController
);
router.get(
	'/user/blog/:blogId',
	roleRequire(['user']),
	interactionController.getUserInteractions
);
export default router;
