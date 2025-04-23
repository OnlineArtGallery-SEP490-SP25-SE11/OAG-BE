import upload from '@/configs/multer.config';
import FileController from '@/controllers/file.controller';
import { Router } from 'express';
const router = Router();
router.post('/', upload.single('file'), FileController.upload);
router.post('/artwork', upload.single('file'), FileController.uploadExternal)
export default router;
