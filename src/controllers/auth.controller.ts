import { Request, Response } from 'express';
// import { phoneSignup } from "@/services/auth.service";
import logger from '@/configs/logger.config';
import { Provider } from '@/types/auth';
import { PhoneSigninInput, PhoneSignupInput } from '@/schemas/auth.schema';
import { generateAndSendOTP, verifyOTP } from '@/services/otp.services';
import AuthService from '@/services/auth.service.ts';
import UserService from '@/services/user.service';
class AuthController {
	async authenticate(req: Request, res: Response) {
		const { provider, providerAccountId, phone, password, tokenId } =
			req.body;
		logger.info(req.body, 'login');
		if (!phone && !tokenId && !providerAccountId) {
			logger.error('Unauthorised');
			res.send('Unauthorised');
		}
		try {
			const result = await AuthService.authenticate(
				{
					phone,
					password
				},
				tokenId,
				{ provider, providerAccountId }
			);

			res.json(result);
		} catch (err: any) {
			logger.error(err.message);
			res.status(500).json({ message: err.message });
		}
	}
	async phoneSignupController(
		req: Request<object, object, PhoneSignupInput>,
		// req: Request,
		res: Response
	) {
		try {
			const { name, phone, password, otp } = req.body;
			const provider = { provider: 'phone' } as Provider;

			//check otp
			const isValidOTP = await verifyOTP(phone, otp);
			logger.info(`isValidOTP: ${isValidOTP}`);

			if (!isValidOTP) {
				res.status(400).json({
					message: 'invalidOtp'
				});
				return;
			}

			//tạo user
			const result = await AuthService.phoneSignup(
				{
					name,
					phone,
					password
				},
				provider
			);
			res.json(result);
		} catch (err: any) {
			logger.error(err.message);
			res.status(500).json({
				isAuthenticated: false,
				message: 'unknown error',
				error: err,
				user: null
			});
		}
	}

	async phoneSigninController(
		req: Request<object, object, PhoneSigninInput>,
		res: Response
	) {
		try {
			const { phone, password } = req.body;

			const result = await AuthService.phoneSignin({ phone, password });
			res.json(result);
		} catch (err: any) {
			logger.error(err.message);
			res.status(500).json({
				isAuthenticated: false,
				message: err.message,
				user: null
			});
		}
	}

	async sendOTPController(req: Request, res: Response) {
		try {
			const { phone } = req.body;
			const existingUser = await UserService.getUserByPhone(phone);
			// Kiểm tra sdt được dùng chưa
			if (existingUser) {
				res.status(400).json({
					message: 'User already exists'
				});
			}

			await generateAndSendOTP(phone);
			res.status(200).json({
				message: 'OTP sent successfully'
			});
		} catch (error: any) {
			logger.error(error.message);
			res.status(500).json({
				message: 'unknown error',
				error: error
			});
		}
	}
	async decodeToken(req: Request, res: Response) {
		const { token } = req.params;
		try {
			const result = await AuthService.decode(token);
			res.json(result);
		} catch (err: any) {
			logger.error(err.message);
			res.status(500).json({ message: err.message });
		}
	}
	async refreshToken(req: Request, res: Response) {
		const { oldToken } = req.body;

		if (!oldToken) {
			res.status(400).json({ message: 'Refresh token required' });
		}

		try {
			const tokens = await AuthService.refreshToken(oldToken);
			res.json(tokens);
		} catch (error: any) {
			logger.error('Refresh token error:', error);
			res.status(401).json({ message: `${error.message}` });
		}
	}
	async generateTokens(req: Request, res: Response) {
		const { userId, role } = req.body;
		try {
			logger.info(userId, role);
			const result = await AuthService.generateTokens(role, userId);
			res.json(result);
		} catch (err: any) {
			logger.error(err.message);
			res.status(500).json({ message: err.message });
		}
	}
}

export default new AuthController();
