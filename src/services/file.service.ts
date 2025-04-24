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
						resource_type: 'image', // Explicitly set resource type to image
						// resource_type: 'video', // Automatically detect resource type
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
			console.log(error)
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

			// Track uploaded resources for potential cleanup
			const uploadedResources = [originalResult.public_id];

			try {
				// --- 2. Create and Upload Low Resolution ---
				// First get original metadata to calculate aspect ratio
				const metadata = await sharp(file.buffer).metadata();
				// Use non-null assertion to tell TypeScript these values will exist
				const aspectRatio = metadata.width! / metadata.height!;
				const targetWidth = 600;
				const targetHeight = Math.round(targetWidth / aspectRatio);

				const lowResBuffer = await sharp(file.buffer)
					.resize({ 
						width: targetWidth,
						height: targetHeight,
						fit: 'inside', // Changed back to 'inside' to preserve aspect ratio
						withoutEnlargement: false
					})
					.jpeg({ quality: 70 })
					.toBuffer();
				const lowResPublicId = `${basePublicId}_lowres`;
				const lowResResult = await this._uploadToCloudinary(
					lowResBuffer,
					lowResPublicId
				);
				uploadedResources.push(lowResResult.public_id);
				
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
				const lowResMetadata = await sharp(lowResBuffer).metadata();
				const imageWidth = lowResMetadata.width || 600;
				const imageHeight = lowResMetadata.height || 400;

				// Optimize watermark size based on image dimensions
				const imageAspectRatio = imageWidth / imageHeight;
				
				// Simpler watermark with shorter text and brighter appearance
				// Size adjusted for "OAG" instead of "Online Art Gallery"
				const baseWidth = Math.min(Math.max(imageWidth * 0.15, 80), 120);
				const baseHeight = Math.min(Math.max(imageHeight * 0.08, 30), 40);
				
				// Smaller padding for concise watermark
				const extraPadding = 10;
				const watermarkWidth = Math.ceil(baseWidth + extraPadding);
				const watermarkHeight = Math.ceil(baseHeight + extraPadding);
				
				// Shorter watermark text
				const watermarkText = 'OAG';
				const fontSize = Math.max(Math.min(baseHeight * 0.6, 24), 18); // Larger font for shorter text
				
				const svgText = `
<svg width="${watermarkWidth}" height="${watermarkHeight}" viewBox="0 0 ${watermarkWidth} ${watermarkHeight}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
      <feOffset dx="1" dy="1" result="offsetblur" />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.6" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:rgba(230,230,230,0.9);" />
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.95);" />
    </linearGradient>
  </defs>
  <style>
    .watermark-container {
      filter: url(#shadow);
    }
    .watermark-text {
      fill: url(#textGradient);
      font-size: ${fontSize}px;
      font-family: Georgia, 'Times New Roman', serif;
      font-style: italic;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .watermark-bg {
      fill: rgba(0, 0, 0, 0.35);
      rx: 5;
      ry: 5;
    }
  </style>
  <g class="watermark-container" transform="translate(${extraPadding/2}, ${extraPadding/2})">
    <rect class="watermark-bg" x="0" y="0" width="${baseWidth}" height="${baseHeight}" />
    <text x="${baseWidth/2}" y="${baseHeight/2 + 2}" class="watermark-text" text-anchor="middle" dominant-baseline="middle">${watermarkText}</text>
  </g>
</svg>`;

				const svgBuffer = Buffer.from(svgText);
				
				// Always position in the corner with consistent small margin
				const cornerMargin = 15;
				const rotationAngle = 0; // No rotation for corner positioning
				
				// Position in bottom-right corner
				const top = imageHeight - watermarkHeight - cornerMargin;
				const left = imageWidth - watermarkWidth - cornerMargin;
				
				let watermarkedBuffer;
				try {
					// Simpler watermarking without rotation
					watermarkedBuffer = await sharp(lowResBuffer)
						.composite([
							{
								input: svgBuffer,
								top: Math.max(0, Math.floor(top)),
								left: Math.max(0, Math.floor(left))
							}
						])
						.toBuffer();
                    
                    // Verify watermark was applied by checking buffer size
                    if (watermarkedBuffer.length <= lowResBuffer.length * 0.99) {
                        logger.warn('Watermark may not have been applied properly - buffer sizes are very similar');
                    }
				} catch (watermarkError:any) {
					logger.error(`Failed to apply text watermark: "${watermarkText}"`, watermarkError);
					throw new Error(`Failed to apply text watermark: ${watermarkError.message}`);
				}

				const watermarkedPublicId = `${basePublicId}_watermarked`;
				const watermarkedResult = await this._uploadToCloudinary(
					watermarkedBuffer,
					watermarkedPublicId
				);
				uploadedResources.push(watermarkedResult.public_id);
				
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
			} catch (innerError) {
				// Cleanup: delete uploaded resources if processing fails
				await this._cleanupUploadedResources(uploadedResources);
				throw innerError;
			}
		} catch (error) {
			console.log(error);
			logger.error('Error in uploadExternal:', error);
			throw error;
		}
	}

	// Helper method to clean up uploaded resources in case of error
	private async _cleanupUploadedResources(publicIds: string[]): Promise<void> {
		try {
			for (const publicId of publicIds) {
				await this._deleteFromCloudinary(publicId);
				logger.info(`Cleaned up resource during error handling: ${publicId}`);
			}
		} catch (cleanupError) {
			logger.error('Error during cleanup of uploaded resources:', cleanupError);
			// We don't throw here to avoid masking the original error
		}
	}

	// Helper to delete a file from Cloudinary
	private async _deleteFromCloudinary(publicId: string): Promise<void> {
		return new Promise((resolve, reject) => {
			cloudinary.uploader.destroy(publicId, (error: any, result: any) => {
				if (error) {
					logger.error(`Failed to delete ${publicId} from Cloudinary:`, error);
					reject(error);
				} else {
					resolve();
				}
			});
		});
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