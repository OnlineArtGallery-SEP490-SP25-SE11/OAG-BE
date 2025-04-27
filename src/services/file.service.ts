import sharp from 'sharp';
import path from 'path';
import cloudinary from '@/configs/cloudinary.config';
import logger from '@/configs/logger.config';
import File from '@/models/file.model';
import env from '@/utils/validateEnv.util';
import { UploadApiResponse } from 'cloudinary';
class FileService {
	// Private helper function to upload a buffer to Cloudinary
	private async _uploadToCloudinary(
		buffer: Buffer,
		publicId: string
	): Promise<UploadApiResponse> {
		return new Promise((resolve, reject) => {
			cloudinary.uploader
				.upload_stream(
					{
						resource_type: 'auto', // Explicitly set resource type to image
						folder: env.CLOUD_IMG_FOLDER,
						public_id: publicId,
						use_filename: false // Use the generated public_id
					},
					(error, results) => {
						if (error) reject(error);
						resolve(results as UploadApiResponse);
					}
				)
				.end(buffer);
		});
	}

	public async upload(
		file: Express.Multer.File,
		refId: string,
		refType: string,
		width?: number,
		height?: number
	): Promise<InstanceType<typeof File>> {
		try {
			const fileExtension = path.extname(file.originalname).toLowerCase();
			const fileName = path.basename(file.originalname, fileExtension);
			const publicId = fileName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now(); // Sanitize and make unique

			const results = await this._uploadToCloudinary(file.buffer, publicId);

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
			logger.error('Error in original upload:', error); // More specific logging
			throw error;
		}
	}

	// Renamed function for processed image upload, usable as an alternative to upload
	public async uploadExternal(
		file: Express.Multer.File,
		refId: string,
		refType: string
	): Promise<InstanceType<typeof File>[]> { // Returns an array of the created files
		try {
			const fileExtension = path.extname(file.originalname).toLowerCase();
			const fileName = path.basename(file.originalname, fileExtension);
			// Generate a base public ID (sanitize filename and add timestamp)
			const basePublicId = fileName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now();

			// --- 1. Upload Original ---
			const originalPublicId = `${basePublicId}_original`;
			const originalResult = await this._uploadToCloudinary(
				file.buffer,
				originalPublicId
			);
			const originalFile = new File({
				publicId: originalResult.public_id,
				url: originalResult.secure_url,
				refId,
				refType,
				width: originalResult.width,
				height: originalResult.height,
				tags: ['original'] // Add a tag to identify
			});
			await originalFile.save();
			logger.info(`Uploaded original: ${originalResult.public_id}`);


			// --- 2. Create and Upload Low Resolution ---
			const lowResBuffer = await sharp(file.buffer)
				.resize({ width: 800, withoutEnlargement: true }) // Resize, don't enlarge if smaller
				.toBuffer();
			const lowResPublicId = `${basePublicId}_lowres`;
			const lowResResult = await this._uploadToCloudinary(
				lowResBuffer,
				lowResPublicId
			);
			const lowResFile = new File({
				publicId: lowResResult.public_id,
				url: lowResResult.secure_url,
				refId,
				refType,
				width: lowResResult.width,
				height: lowResResult.height,
				tags: ['lowres'] // Add a tag to identify
			});
			await lowResFile.save();
			logger.info(`Uploaded low-res: ${lowResResult.public_id}`);


			// --- 3. Create and Upload Watermarked Low Resolution ---
			/* // Temporarily removed check as watermark text is hardcoded below
			if (!env.WATERMARK_TEXT) { // Check for WATERMARK_TEXT instead of WATERMARK_PATH
				logger.warn('WATERMARK_TEXT environment variable not set. Skipping watermarking.');
				// Decide how to handle this. Throwing an error might be appropriate if watermarking is mandatory.
				throw new Error('Watermark text (WATERMARK_TEXT) is not configured in environment variables.');
			}
			*/

			// Get image dimensions for SVG sizing/positioning
			const lowResMetadata = await sharp(lowResBuffer).metadata();
			const imageWidth = lowResMetadata.width || 800; // Fallback width
			const imageHeight = lowResMetadata.height || 600; // Fallback height

			// --- Generate SVG Watermark ---
			const watermarkText = 'OAG'; // Temporarily hardcoded watermark text
			const fontSize = Math.min(imageWidth / 20, imageHeight / 15); // Adjust font size based on image dimensions
			const svgText = `
			<svg width="${imageWidth}" height="${imageHeight}">
			  <style>
			  .title {
				fill: rgba(255, 255, 255, 0.4); /* White text with 40% opacity */
				font-size: ${fontSize}px;
				font-family: Arial, sans-serif;
				text-anchor: end; /* Align text to the right */
			  }
			  </style>
			  <text x="${imageWidth - fontSize * 0.5}" y="${imageHeight - fontSize * 0.5}" class="title">${watermarkText}</text>
			</svg>
			`;
			const svgBuffer = Buffer.from(svgText);
			// --- End Generate SVG Watermark ---

			let watermarkedBuffer;
			try {
				watermarkedBuffer = await sharp(lowResBuffer)
					.composite([
						{
							input: svgBuffer, // Use the generated SVG buffer
							gravity: 'southeast' // Keep gravity, though SVG positioning might override
							// Alternatively, remove gravity and rely solely on SVG x/y
							// input: svgBuffer, top: 0, left: 0 // Position SVG at top-left if not using gravity
						}
					])
					.toBuffer();
			} catch (watermarkError:any) {
				logger.error(`Failed to apply text watermark: "${watermarkText}"`, watermarkError);
				throw new Error(`Failed to apply text watermark: ${watermarkError.message}`);
			}


			const watermarkedPublicId = `${basePublicId}_watermarked`;
			const watermarkedResult = await this._uploadToCloudinary(
				watermarkedBuffer,
				watermarkedPublicId
			);
			const watermarkedFile = new File({
				publicId: watermarkedResult.public_id,
				url: watermarkedResult.secure_url,
				refId,
				refType,
				width: watermarkedResult.width,
				height: watermarkedResult.height,
				tags: ['watermarked', 'lowres'] // Add tags
			});
			await watermarkedFile.save();
			logger.info(`Uploaded watermarked: ${watermarkedResult.public_id}`);


			return [originalFile, lowResFile, watermarkedFile]; // Return array of files

		} catch (error) {
			logger.error('Error in uploadProcessedImage:', error);
			// Consider cleanup: If some uploads succeeded but others failed,
			// you might want to delete the already uploaded files from Cloudinary.
			// This requires adding deletion logic here.
			throw error; // Re-throw the error after logging
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
