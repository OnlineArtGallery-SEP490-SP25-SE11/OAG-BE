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
    AddHeartSchema,
    RemoveHeartSchema,
    IsHeartSchema,
    GetHeartUsersSchema
} from "@/dto/blog.dto";
import permanentBan from '@/configs/middleware.config'


const router = Router();
const blogController = container.get<BlogController>(TYPES.BlogController);

router.get("/", blogController.find);
router.get("/published", blogController.findPublished);
router.get('/last-edited', roleRequire([Role.ARTIST]), blogController.findLastEditedByUser);
router.get('/user-blogs', roleRequire([Role.ARTIST]), blogController.findUserBlogs);
router.get('/:id', blogController.findById);

router.post('/', roleRequire([Role.ARTIST, Role.ADMIN]), validate(CreateBlogPayload),permanentBan(), blogController.create);
router.put("/:id", roleRequire([Role.ARTIST, Role.ADMIN]), validate(UpdateBlogSchema), blogController.update);
router.delete("/:id", roleRequire([Role.ARTIST, Role.ADMIN]), blogController.delete);

// Blog workflow status transitions
router.put("/:id/request-publish", roleRequire([Role.ARTIST]), blogController.requestPublish);
router.put("/:id/approve", roleRequire([Role.ADMIN]), blogController.approve);
router.put("/:id/reject", roleRequire([Role.ADMIN]), validate(RejectBlogSchema), blogController.reject);

// Thả tim cho bài blog
router.put("/:id/addHeart", roleRequire([Role.USER, Role.ARTIST, Role.ADMIN]), validate(AddHeartSchema), blogController.addHeart);

// Bỏ tim khỏi bài blog
router.put("/:id/removeHeart", roleRequire([Role.USER, Role.ARTIST, Role.ADMIN]), validate(RemoveHeartSchema), blogController.removeHeart);

// Lấy số lượng tim của bài blog
router.get("/:id/heart-count", blogController.getHeartCount);

// ✅ Kiểm tra người dùng đã thả tim hay chưa
router.get("/:id/isHeart/:userId", blogController.isHeart);

// ✅ Lấy danh sách người đã thả tim
router.get("/:id/heart-users", blogController.getHeartUsers);


export default router;