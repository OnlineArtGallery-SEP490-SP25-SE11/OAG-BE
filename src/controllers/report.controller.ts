// ReportController.ts
import { BaseHttpResponse } from '@/lib/base-http-response';
import { ReportService } from '@/services/report.service';
import { ForbiddenException } from '@/exceptions/http-exception';
import { NextFunction, Request, Response } from 'express';
import logger from '@/configs/logger.config';

export class ReportController {
	private readonly _reportService = new ReportService();

	constructor() {
		this.get = this.get.bind(this);
		this.getById = this.getById.bind(this);
		this.create = this.create.bind(this);
        this.updateStatus = this.updateStatus.bind(this);
		this.action = this.action.bind(this);
		this.getByReporterId = this.getByReporterId.bind(this);
	}

	async get(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const reports = await this._reportService.get();
			const response = BaseHttpResponse.success(
				reports,
				200,
				'Get reports success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}

	async getById(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const id = req.params.id;
			const report = await this._reportService.getById(id);
			const response = BaseHttpResponse.success(
				report,
				200,
				'Get report by id success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}

	async getByReporterId(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const reporterId = req.params.reporterId;
			const reports = await this._reportService.getByReporterId(reporterId);
			const response = BaseHttpResponse.success(
				reports,
				200,
				'Get reports by reporter id success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}

	async create(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
		  // Extract data from request body
		  const { refId, refType, reason, description, url, image } = req.body;
		  
		  // Get reporterId from the authenticated user
		  // Using userId instead of user.id as we see in your event controller
		  const reporterId = req.userId;
		  
		  // Debug information
		  console.log('Creating report with data:', { 
			reporterId, refId, refType, reason, description, url, 
			image: image ? (Array.isArray(image) ? `${image.length} images` : 'image provided') : 'no image' 
		  });
		  
		  // Validate required fields
		  if (!reporterId) {
			throw new ForbiddenException('Forbidden');
		  }
		  
		  if (!refId || !refType || !reason) {
			throw new ForbiddenException('Missing required fields');
		  }
	
		  // Call service to create report
		  const report = await this._reportService.create(
			reporterId,
			refId,
			refType,
			reason,
			description || '', 
			url || '', 
			image || []
		  );
	
		  // Return successful response using BaseHttpResponse
		  const response = BaseHttpResponse.success(
			report, 
			201, 
			'Report created successfully'
		  );
		  
		  return res.status(response.statusCode).json(response);
		} catch (error) {
		  logger.error(error, 'Error creating report');
		  next(error);
		}
	  }

	async updateStatus(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<any> {
		try {
			const id = req.params.id;
			const status = req.body.status;
			const report = await this._reportService.updateStatus(id, status);
			const response = BaseHttpResponse.success(
				report,
				200,
				'Update report status success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error);
		}
	}
    // ban/unban or warning
	async action(req: Request, res: Response, next: NextFunction): Promise<any> {
		try {
			const id = req.params.id; // Lấy report id từ params
			const action = req.body.action; // Lấy action từ body request
	
			// Gọi service để thực hiện logic action
			const user = await this._reportService.action(id, action);

			if(!user){
				const response = BaseHttpResponse.error(
					'null',
					404,
					null
				);
				return res.status(response.statusCode).json(response);
			}
	
			const response = BaseHttpResponse.success(
				user,
				200,
				'Action report success'
			);
			return res.status(response.statusCode).json(response);
		} catch (error) {
			next(error); // Xử lý lỗi qua middleware
		}
	}
}
