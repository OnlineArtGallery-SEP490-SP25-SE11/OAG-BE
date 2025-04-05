import { Router } from "express";
import roleRequire from "@/configs/middleware.config";
import { Role } from "@/constants/enum";
import { TYPES } from "@/constants/types";
import { CCCDController } from "@/controllers/cccd.controller";
import container from "@/configs/container.config";
import { validate } from "@/middlewares/validate.middleware";
import { CreateCCCDSchema, UpdateCCCDSchema } from "@/dto/cccd.dto";

const router = Router();
const cccdController = container.get<CCCDController>(TYPES.CCCDController);

router.post(
  "/",
  roleRequire([Role.ARTIST, Role.USER]),
  validate(CreateCCCDSchema),
  cccdController.create
);

router.get("/:id", roleRequire([Role.ARTIST, Role.USER]), cccdController.getCCCDById);

router.get("/user/:userId", roleRequire([Role.ARTIST, Role.USER]), cccdController.getCCCDByUserId);

router.put(
  "/:id",
  roleRequire([Role.ARTIST, Role.USER]),
  validate(UpdateCCCDSchema),
  cccdController.update
);

router.delete("/:id", roleRequire([Role.ARTIST, Role.USER]), cccdController.delete);

export default router;
