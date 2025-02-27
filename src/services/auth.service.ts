// Purpose: Service for authenticating users using OAuth2.0.
import logger from '@/configs/logger.config';
import User from '@/models/user.model';
import { OAuth2Client } from 'google-auth-library';
import {
	DecodedToken,
	OAuthProfile,
	PhoneProfile,
	Provider,
	UserProfile
} from '@/types/auth';
import env from '@/utils/validateEnv.util';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import RefreshToken from '@/models/refresh-token.model';
import mongoose from 'mongoose';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);

interface AuthResult {
	isAuthenticated: boolean;
	message: string;
	result: {
		accessToken: string;
		refreshToken: string;
		id: string;
		role: string[];
	} | null;
}

class AuthService {
	async oauth(
		profile: OAuthProfile,
		tokenId: string,
		provider: Provider
	): Promise<AuthResult> {
		try {
			const _user = await User.findOne({
				provider: provider.provider,
				providerId: provider.providerAccountId
			});
			const ticket = await client.verifyIdToken({
				idToken: tokenId,
				audience: env.GOOGLE_CLIENT_ID
			});

			const payload = ticket.getPayload();
			if (payload?.aud !== env.GOOGLE_CLIENT_ID) {
				return {
					isAuthenticated: false,
					message: 'Invalid token!',
					result: null
				};
			}
			if (!_user) {
				logger.debug(profile);
				const newUser = new User({
					name: payload?.name,
					email: payload?.email,
					image: payload?.picture,
					role: ['user'],
					provider: provider.provider,
					providerId: provider.providerAccountId
				});
				const savedUser = await newUser.save();
				logger.info(savedUser, 'savedUser');
				const { accessToken, refreshToken } = await this.generateTokens(
					newUser._id.toString(),
					newUser.role
				);
				return {
					isAuthenticated: true,
					message: 'Authentication new user!',
					result: {
						id: savedUser._id.toString(),
						accessToken,
						refreshToken,
						role: savedUser.role
					}
				};
			} else {
				const { accessToken, refreshToken } = await this.generateTokens(
					_user._id.toString(),
					_user.role
				);
				logger.info(_user, 'user');
				return {
					isAuthenticated: true,
					message: 'Authentication successful!',
					result: {
						id: _user._id.toString(),
						accessToken,
						refreshToken,
						role: _user.role
					}
				};
			}
		} catch (err: any) {
			logger.error(err.message);
			return {
				isAuthenticated: false,
				message: `Authentication oauth failed!,${err.message}`,
				result: null
			};
		}
	}
	async authenticate(
		profile: UserProfile,
		tokenId: string | undefined,
		provider: Provider
	): Promise<{
		isAuthenticated: boolean;
		message: string;
	}> {
		if (provider.provider === 'phone') {
			return await this.phoneSignin(profile as PhoneProfile);
		} else {
			return await this.oauth(
				profile as OAuthProfile,
				tokenId!,
				provider
			);
		}
	}
	/**
	 *
	 * @returns
	 * @param userId
	 * @param role
	 */
	async generateTokens(
		userId: string,
		role: string[]
	): Promise<{ accessToken: string; refreshToken: string }> {
		//delete old refresh token
		await RefreshToken.deleteMany({ userId });
		const userObjectId = new mongoose.Types.ObjectId(userId);
		await RefreshToken.updateMany(
			{ userId: userObjectId, isRevoked: false },
			{ isRevoked: true }
		);

		const accessToken = jwt.sign(
			{
				id: userId,
				role
			},
			env.JWT_SECRET,
			{
				expiresIn: env.JWT_EXPIRE,
				algorithm: 'HS256',
				allowInsecureKeySizes: true
			}
		);

		const refreshToken = jwt.sign(
			{
				id: userId,
				role
			},
			env.REFRESH_TOKEN_SECRET,
			{
				expiresIn: env.REFRESH_TOKEN_EXPIRE,
				algorithm: 'HS256',
				allowInsecureKeySizes: true
			}
		);

		const refreshTokenDoc = new RefreshToken({
			userId: userObjectId,
			token: refreshToken,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
		});

		await refreshTokenDoc.save();

		return { accessToken, refreshToken };
	}

	async decode(token: string): Promise<DecodedToken> {
		try {
			return (await jwt.verify(token, env.JWT_SECRET)) as DecodedToken;
		} catch (err: any) {
			logger.error(err.message);
			throw new Error(`Decode token failed!,${err}`);
		}
	}

	async refreshToken(oldToken: string) {
		try {
			const decoded = jwt.verify(
				oldToken,
				env.REFRESH_TOKEN_SECRET
			) as DecodedToken;

			const storedToken = await RefreshToken.findOne({
				token: oldToken
				// isRevoked: false,
			});

			if (!storedToken) {
				logger.error('Invalid refresh token');
				throw new Error('Invalid refresh token');
			}

			if (storedToken.expiresAt < new Date()) {
				await RefreshToken.deleteOne({ _id: storedToken._id });
				logger.error('Refresh token expired');
				throw new Error('Refresh token expired');
			}

			const { accessToken, refreshToken } = await this.generateTokens(
				decoded.id,
				decoded.role
			);

			await RefreshToken.updateOne(
				{ _id: storedToken._id },
				{ isRevoked: true }
			);

			return {
				accessToken,
				refreshToken
			};
		} catch (err: any) {
			logger.error(err.message);
			throw new Error(`Refresh token failed!,${err}`);
		}
	}
	/**
	 *
	 * @param profile
	 * @param provider
	 * @returns
	 */
	async phoneSignup(
		profile: {
			name: string;
			phone: string;
			password: string;
		},
		provider: Provider
	): Promise<{
		message: string;
		user: InstanceType<typeof User> | null;
	}> {
		try {
			// check user tồn tại hay chưa
			const existingUser = await User.findOne({ phone: profile.phone });
			if (existingUser) {
				return {
					message: 'phoneNumberAlreadyRegistered',
					user: null
				};
			}

			// tạo user mới
			const newUser = new User({
				name: profile.name,
				phone: profile.phone,
				password: profile.password,
				image: 'https://www.gravatar.com/avatar/?d=mp',
				role: ['user'],
				provider: provider.provider
			});
			const savedUser = await newUser.save();
			return {
				message: 'userRegisteredSuccessfully',
				user: savedUser
			};
		} catch (err: any) {
			logger.error(err.message);
			return {
				message: 'registrationFailed',
				user: null
			};
		}
	}

	async phoneSignin(profile: PhoneProfile): Promise<AuthResult> {
		try {
			const user = await User.findOne({ phone: profile.phone }).select(
				'+password'
			); //overide mặc định không trả về password
			if (!user) {
				return {
					isAuthenticated: false,
					message: 'userNotFound',
					result: null
				};
			}
			const isPasswordValid = await bcrypt.compare(
				profile.password,
				user.password!
			);
			if (!isPasswordValid) {
				return {
					isAuthenticated: false,
					message: 'passwordIncorrect',
					result: null
				};
			}

			user.password = undefined;
			const { accessToken, refreshToken } = await this.generateTokens(
				user._id.toString(),
				user.role
			);
			return {
				isAuthenticated: true,
				message: 'authenticationSuccessful',
				result: {
					accessToken,
					refreshToken,
					id: user._id.toString(),
					role: user.role
				}
			};
		} catch (err: any) {
			logger.error(err.message);
			return {
				isAuthenticated: false,
				message: 'authenticationFailed',
				result: null
			};
		}
	}
}

export default new AuthService();
