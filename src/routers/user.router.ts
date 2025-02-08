import logger from '@/configs/logger.config';
import roleRequire from '@/configs/middleware.config';
import UserService from '@/services/user.service';
import { Request, Response, Router } from 'express';

const router = Router();
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

export default router;
