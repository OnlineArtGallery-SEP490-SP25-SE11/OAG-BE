import { Redis } from '@upstash/redis';
// import { Twilio } from "twilio";
import env from '@/utils/validateEnv.util';
import logger from '@/configs/logger.config';

const redis = new Redis({
	url: env.UPSTASH_REDIS_REST_URL,
	token: env.UPSTASH_REDIS_REST_TOKEN
});

// const twilio = new Twilio(env.TWILIO_SID, env.TWILIO_AUTH_TOKEN);

export async function generateAndSendOTP(phone: string): Promise<void> {
	// kiểm tra sdt đã được gửi OTP trước đó, nếu có thì xóa
	const existingOTP = await redis.get(`otp:${phone}`);
	if (existingOTP) {
		await redis.del(`otp:${phone}`);
	}
	const OTP_TTL = 60 * 3; //time-to-live otp hiệu lực 3 phút
	// const otp = Math.floor(100000 + Math.random() * 900000).toString(); //6 số
	const otp = '123456';

	// Lưu OTP vào Redis với TTL
	await redis.set(`otp:${phone}`, otp, { ex: OTP_TTL });
	// Gửi SMS qua Twilio
	logger.info('Gửi SMS qua Twilio 123456');
	// TODO: gửi qua twilio hoặc dịch vụ khác
	// await twilio.messages.create({
	//     body: `Your verification code is: ${otp}`,
	//     to: phone,
	//     from: process.env.TWILIO_PHONE
	// });
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
	const storedOTP = await redis.get(`otp:${phone}`);

	if (!storedOTP) return false;

	const isValid = String(storedOTP) === String(otp);

	if (isValid) {
		await redis.del(`otp:${phone}`);
	}

	return isValid;
}
