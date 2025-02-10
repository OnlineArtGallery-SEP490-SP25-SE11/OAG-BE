import cloudinary from '../configs/cloudinary.config';

export class UploadService {
	async uploadImage(file: string): Promise<any> {
		try {
			const result = await cloudinary.uploader.upload(file, {
				folder: 'oag',
				allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
				transformation: [{ width: 1000, crop: 'limit' }]
			});
			return result;
		} catch (error) {
			throw new Error('Upload failed');
		}
	}

	async deleteImage(publicId: string): Promise<void> {
		try {
			await cloudinary.uploader.destroy(publicId);
		} catch (error) {
			throw new Error('Delete failed');
		}
	}
}
