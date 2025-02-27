import { Router } from "express";
import roleRequire from "@/configs/middleware.config";
import { Role } from "@/constants/enum";
import { TYPES } from "@/constants/types";
import { BlogTagController } from "@/controllers/blog-tag.controller";
import container from "@/configs/container.config";

const router = Router();
const tagController = container.get<BlogTagController>(TYPES.BlogTagController);

// Get all tags - public route
router.get("/", tagController.getTags);

// Create tag - admin only
router.post("/", roleRequire([Role.ADMIN]), tagController.createTag);

// Delete tag - admin only
router.delete("/:id", roleRequire([Role.ADMIN]), tagController.deleteTag);

export default router;