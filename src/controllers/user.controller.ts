import { User } from '@/models/user.model';
import { UploadService } from '../services/upload.service';
import multer from 'multer';
import { Request, Response } from 'express';
import { RequestHandler } from 'express-serve-static-core';

const uploadService = new UploadService();

const upload = multer({
	storage: multer.memoryStorage()
});

interface MulterRequest extends Request {
	file?: Express.Multer.File;
	user?: { id: string };
}

export class UserController {
	updateAvatar = [
		upload.single('image'),
		async (req: MulterRequest, res: Response) => {
			try {
				const image = req.file?.buffer.toString('base64');
				const userId = req.user?.id;

				if (!image) {
					return res.status(400).json({ error: 'No image provided' });
				}

				const result = await uploadService.uploadImage(image);
				await User.findByIdAndUpdate(userId, {
					avatar: result.secure_url,
					avatarPublicId: result.public_id
				});

				res.json({
					success: true,
					avatar: result.secure_url
				});
			} catch (error) {
				res.status(500).json({ error: 'Upload failed' });
			}
		}
	];
}
