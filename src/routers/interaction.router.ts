import { Router } from "express";
import { InteractionController } from "@/controllers/interaction.controller";
import container from "@/configs/container.config";
import { TYPES } from "@/constants/types";
import roleRequire from "@/configs/middleware.config";
const router = Router();
const interactionController = container.get<InteractionController>(TYPES.InteractionController);
router.get("/user/blog/:blogId", roleRequire(["user"]), interactionController.getUserInteractions);
export default router;