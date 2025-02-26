import { Router } from "express";
import roleRequire from "@/configs/middleware.config";
import { Role } from "@/constants/enum";
import { TYPES } from "@/constants/types";
import { BlogController } from "@/controllers/blog.controller";
import container from "@/configs/container.config";
const router = Router();
const blogController = container.get<BlogController>(TYPES.BlogController);

router.get("/", blogController.getBlogs);
router.get("/published", blogController.getPublishedBlogs);
router.get(
	'/last-edited',
	roleRequire(['user']),
	blogController.getLastEditedBlog
);
router.get('/:id', blogController.getBlogById);
router.post('/', roleRequire([Role.USER, Role.ADMIN]), (req, res, next) => {
	blogController.createBlog(req, res, next);
});
router.put("/:id", roleRequire(["user", "admin"]), blogController.updateBlog);
router.delete("/:id", blogController.deleteBlog);
  
export default router;