import { Router } from 'express';
import { BlogController } from '@/controllers/blog.controller';
import roleRequire from '@/configs/middleware.config';
import { Role } from '@/constants/enum';
import { BlogService } from '@/services/blog.service'; 

const router = Router();
const blogService = new BlogService();
const blogController = new BlogController(blogService);
router.get('/', blogController.getBlogs);
router.get(
	'/last-edited',
	roleRequire(['user']),
	blogController.getLastEditedBlog
);
router.get('/:id', blogController.getBlogById);
router.post('/', roleRequire([Role.USER, Role.ADMIN]), (req, res, next) => {
	blogController.createBlog(req, res, next);
});
router.put('/:id', roleRequire(['user', 'admin']), blogController.updateBlog);
router.delete('/:id', blogController.deleteBlog);

export default router;
