import { Router } from "express";
import roleRequire from "@/configs/middleware.config";
import { Role } from "@/constants/enum";
import { TYPES } from "@/constants/types";
import { BlogController } from "@/controllers/blog.controller";
import container from "@/configs/container.config";
import { validate } from "@/middlewares/validate.middleware";
import { 
    CreateBlogPayload, 
    UpdateBlogSchema,
    RejectBlogSchema,
} from "@/dto/blog.dto";

const router = Router();
const blogController = container.get<BlogController>(TYPES.BlogController);

router.get("/", blogController.findAll);
router.get("/published", blogController.findPublished);
router.get('/last-edited', roleRequire(['user']), blogController.findLastEditedByUser);
router.get('/:id', blogController.findById);

router.post('/', roleRequire([Role.USER, Role.ADMIN]), validate(CreateBlogPayload), blogController.create);
router.put("/:id", roleRequire([Role.ARTIST, Role.ADMIN]), validate(UpdateBlogSchema), blogController.update);
router.delete("/:id", roleRequire([Role.ARTIST, Role.ADMIN]), blogController.delete);

// Blog workflow status transitions
router.put("/:id/request-publish", roleRequire([Role.ARTIST]), blogController.requestPublish);
router.put("/:id/approve", roleRequire([Role.ADMIN]), blogController.approve);
router.put("/:id/reject", roleRequire([Role.ADMIN]), validate(RejectBlogSchema), blogController.reject);

export default router;