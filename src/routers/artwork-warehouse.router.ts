import express from 'express';
import { ArtworkWarehouseController } from '../controllers/artwork-warehouse.controller';
import roleRequire from '@/configs/middleware.config.ts';
import { Role } from '@/constants/enum.ts';
import container from '@/configs/container.config';
import { TYPES } from '@/constants/types';

const router = express.Router();
const artworkWarehouseController = container.get<ArtworkWarehouseController>(TYPES.ArtworkWarehouseController);

// Lấy danh sách tranh đã mua trong kho
router.get('/', roleRequire([Role.USER, Role.ARTIST]), artworkWarehouseController.getArtworkWarehouse);

// Tải ảnh từ kho
router.get('/download/:id', roleRequire([Role.USER, Role.ARTIST]), artworkWarehouseController.downloadArtwork);

export default router; 