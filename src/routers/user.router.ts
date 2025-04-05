import logger from '@/configs/logger.config'; 
import roleRequire from '@/configs/middleware.config';
import UserService from '@/services/user.service';
import { Request, Response, Router } from 'express';
import { UserController } from '@/controllers/user.controller';
const router = Router();
const userController = new UserController();

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
//admin function user
router.get('/all-user', roleRequire(['admin']), userController.getAllUser);
router.get('/:id', roleRequire(['admin']), userController.getUserById);

// Cập nhật thông tin user
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

// Follow một user
router.post('/follow/:targetUserId', roleRequire(), async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const targetUserId = req.params.targetUserId;
        await UserService.followUser(userId, targetUserId);
        res.status(200).json({ message: 'Followed successfully' });
    } catch (err: any) {
        logger.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// Unfollow một user
router.post('/unfollow/:targetUserId', roleRequire(), async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const targetUserId = req.params.targetUserId;
        await UserService.unfollowUser(userId, targetUserId);
        res.status(200).json({ message: 'Unfollowed successfully' });
    } catch (err: any) {
        logger.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// Kiểm tra trạng thái follow
router.get('/is-following/:targetUserId', roleRequire(), async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const targetUserId = req.params.targetUserId;
        const isFollowing = await UserService.isFollowingUser(userId, targetUserId);
        res.status(200).json({ isFollowing });
    } catch (err: any) {
        logger.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// Lấy danh sách followers
router.get('/followers', roleRequire(), async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const followers = await UserService.getFollowers(userId);
        res.status(200).json({ followers });
    } catch (err: any) {
        logger.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// Lấy danh sách following
router.get('/following', roleRequire(), async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const following = await UserService.getFollowing(userId);
        res.status(200).json({ following });
    } catch (err: any) {
        logger.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// Gửi yêu cầu "Become Artist"
router.post('/request-become-artist', roleRequire(), async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const response = await UserService.requestBecomeArtist(userId);
        res.status(200).json(response);
    } catch (err: any) {
        logger.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// Admin duyệt yêu cầu "Become Artist"
router.post('/approve-become-artist/:userId', roleRequire(['admin']), async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const response = await UserService.approveBecomeArtist(userId);
        res.status(200).json(response);
    } catch (err: any) {
        logger.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// Lấy danh sách user gửi yêu cầu "Become Artist"
router.get('/pending-become-artist', roleRequire(['admin']), async (_req: Request, res: Response) => {
    try {
        const users = await UserService.getPendingArtistRequests();
        res.status(200).json({ users });
    } catch (err: any) {
        logger.error(err.message);
        res.status(500).json({ message: err.message });
    }
});


export default router;
