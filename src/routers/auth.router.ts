import roleRequire from '@/configs/middleware.config';
import AuthController from '@/controllers/auth.controller';
import { validate } from '@/middlewares/validate.middleware';
import { phoneSchema, phoneSignupSchema } from '@/schemas/auth.schema';
import { Request, Response, Router } from 'express';

const router = Router();
router.post('/', AuthController.authenticate);
router.post(
	'/phone/send-otp',
	validate(phoneSchema),
	AuthController.sendOTPController
);
router.post(
	'/phone/signup',
	validate(phoneSignupSchema),
	AuthController.phoneSignupController
);

// router.post(
//   "/phone/signin",
//   validate(phoneSigninSchema),
//   AuthController.phoneSigninController
// );

router.post('/token', AuthController.generateTokens);
router.post('/refresh', AuthController.refreshToken);
router.get('/decode/:token', AuthController.decodeToken);

// router.get("/refresh/:token", async (req: Request, res: Response) => {
//   const { token } = req.params;
//   try {
//     const result = await refreshToken(token);
//     res.json(result);
//   } catch (err: any) {
//     logger.error(err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

router.get('/test', roleRequire(), async (req: Request, res: Response) => {
	res.json({ message: 'Auth router works!' });
});

router.get(
	'/test/admin',
	roleRequire('admin'),
	async (req: Request, res: Response) => {
		res.json({ message: 'Admin router works!' });
	}
);

export default router;
