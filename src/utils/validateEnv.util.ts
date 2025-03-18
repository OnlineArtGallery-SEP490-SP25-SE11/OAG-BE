import 'dotenv/config';
import { cleanEnv, port, str } from 'envalid';
const env = cleanEnv(process.env, {
	PORT: port({ default: 5000 }),
	CLIENT_URL: str({ default: 'http://localhost:3000' }),
	ADMIN_URL: str({ default: 'http://localhost:3001' }),
	MONGO_URI: str({ default: 'mongodb://localhost:27017/art_vault' }),
	JWT_SECRET: str(),
	JWT_EXPIRE: str({ default: '1d' }),
	REFRESH_TOKEN_SECRET: str(),
	REFRESH_TOKEN_EXPIRE: str({ default: '7d' }),
	GOOGLE_CLIENT_ID: str(),
	GOOGLE_CLIENT_SECRET: str(),
	TWILIO_SID: str(),
	TWILIO_AUTH_TOKEN: str(),
	TWILIO_PHONE: str(),
	UPSTASH_REDIS_REST_URL: str(),
	UPSTASH_REDIS_REST_TOKEN: str(),
	CLOUDINARY_CLOUD_NAME: str(),
	CLOUDINARY_API_KEY: str(),
	CLOUDINARY_API_SECRET: str(),
	CLOUD_IMG_FOLDER: str(),
	PAYOS_CLIENT_ID: str(),
	PAYOS_API_KEY: str(),
	PAYOS_CHECKSUM_KEY: str()
});
export default env;
