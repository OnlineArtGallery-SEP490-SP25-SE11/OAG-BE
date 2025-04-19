import cloudinary from '@/configs/cloudinary.config';
import logger from '@/configs/logger.config';
import File from '@/models/file.model';
import env from '@/utils/validateEnv.util';
import { UploadApiResponse } from 'cloudinary';
class FileService {
	public async upload(
		file: Express.Multer.File,
		refId: string,
		refType: string,
		width?: number,
		height?: number
	): Promise<InstanceType<typeof File>> {
		try {
			// const fileExtension = path.extname(file.originalname).toLowerCase();
			// const fileName = path.basename(file.originalname, fileExtension);
			// const publicId = fileName + Date.now();
			const results: UploadApiResponse = await new Promise(
				(resolve, reject) => {
					cloudinary.uploader
						.upload_stream(
							{
								resource_type: 'auto',
								folder: env.CLOUD_IMG_FOLDER,
								use_filename: true
								// public_id: publicId,
							},
							(error, results) => {
								if (error) reject(error);
								resolve(results as UploadApiResponse);
							}
						)
						.end(file.buffer);
				}
			);

			const _file = new File({
				publicId: results.public_id,
				url: results.secure_url,
				...(refId && { refId }),
				...(refType && { refType }),
				...(width && { width }),
				...(height && { height })
			});
			return await _file.save();
		} catch (error) {
			logger.error(error);
			throw error;
		}
	}

	public async getFileIds(urls: string | string[]): Promise<string[]> {
		try {
			const urlArray = Array.isArray(urls) ? urls : [urls];
			const files = await File.find({ url: { $in: urlArray } }).select(
				'_id'
			);
			return files.map((file) => file._id as string);
		} catch (error) {
			logger.error(error);
			throw error;
		}
	}
}

export default new FileService();
