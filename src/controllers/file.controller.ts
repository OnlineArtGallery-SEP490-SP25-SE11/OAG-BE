import logger from '@/configs/logger.config';
import FileService from '@/services/file.service';
import { NextFunction, Request, Response } from 'express';
class FileController {
	public async upload(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			if (!req.file || Object.keys(req.file).length === 0) {
				res.status(400).send('No files were uploaded.');
			}
			const { refId, refType, width, height } = req.body;
			const multerFile = {
				buffer: req.file?.buffer,
				originalname: req.file?.originalname,
				mimetype: req.file?.mimetype
			} as Express.Multer.File;
			const uploadedFile = await FileService.upload(
				multerFile,
				refId,
				refType,
				Number(width),
				Number(height)
			);
			res.status(201).json(uploadedFile);
		} catch (error) {
			logger.error(error);
			if (error instanceof Error) {
				res.status(500).json({ message: error.message });
			} else {
				res.status(500).json({ message: 'An unknown error occurred' });
			}
			next(error);
		}
	}

	// New method for external upload processing
	public async uploadExternal(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			if (!req.file || Object.keys(req.file).length === 0) {
				res.status(400).send('No files were uploaded.');
				return; // Stop execution if no file
			}
			const { refId, refType } = req.body; // Only need refId and refType
			const multerFile = {
				buffer: req.file?.buffer,
				originalname: req.file?.originalname,
				mimetype: req.file?.mimetype
			} as Express.Multer.File;

			// Call the FileService.uploadExternal method
			const uploadedFiles = await FileService.uploadExternal(
				multerFile,
				refId,
				refType
			);

			res.status(201).json(uploadedFiles); // Return the array of created files
		} catch (error) {
			logger.error('Error in uploadExternal:', error); // Log specific error source
			if (error instanceof Error) {
				res.status(500).json({ message: error.message });
			} else {
				res.status(500).json({ message: 'An unknown error occurred during external upload' });
			}
			next(error);
		}
	}
	
}

export default new FileController();
