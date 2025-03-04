import logger from '@/configs/logger.config';
import roleRequire from '@/configs/middleware.config';
import UserService from '@/services/user.service';
import { Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';


const router = Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'));
        }
    }
});

router.get('/', roleRequire(), async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const user = await UserService.getProfile(userId);
        res.status(200).json({ user });
    } catch (err: any) {
        logger.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

router.put('/', roleRequire(), async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const user = await UserService.updateProfile(userId, req.body);
        res.status(200).json({ user });
    } catch (err: any) {
        logger.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

router.put('/avatar', roleRequire(), upload.single('avatar'), async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        console.log('Received avatar upload request');
        console.log('File:', req.file);
        console.log('User ID:', req.userId);

        const userId = req.userId as string;
        const user = await UserService.updateAvatar(userId, req.file);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        console.log('Sending response with user:', user);
        res.status(200).json({ user });
    } catch (err: any) {
        console.error('Error in avatar upload route:', err);
        logger.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

export default router;