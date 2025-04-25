import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/constants/types';
import { ArtistRequestQueryOptions, ArtistRequestService } from '@/services/artist-request.service';
import { BaseHttpResponse } from '@/lib/base-http-response';
import { BadRequestException, NotFoundException } from '@/exceptions/http-exception';

@injectable()
export class ArtistRequestController {
  constructor(
    @inject(TYPES.ArtistRequestService) private readonly artistRequestService: ArtistRequestService
  ) {
    this.getMyRequest =  this.getMyRequest.bind(this);
    this.getRequestById = this.getRequestById.bind(this);
    this.updateRequestStatus = this.updateRequestStatus.bind(this);
    this.createRequest = this.createRequest.bind(this);
    this.getRequests = this.getRequests.bind(this);
  }

   async getRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Optional role-checking can be added here if needed
      
      // Parse query parameters
      const options: ArtistRequestQueryOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        filter: {}
      };
      
      // Parse and validate status filter if provided
      if (req.query.status) {
        options.filter = {
          ...options.filter,
          status: req.query.status as any
        };
      }
      
      // Parse sort options
      if (req.query.sortBy) {
        const sortField = req.query.sortBy as string;
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        options.sort = { [sortField]: sortOrder };
      }
      
      const result = await this.artistRequestService.getRequests(options);
      
      const response = BaseHttpResponse.success(
        result,
        200,
        'Artist requests retrieved successfully'
      );
      
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async createRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const requestData = req.validatedData;
      const artistRequest = await this.artistRequestService.createRequest(userId, requestData);
      
      const response = BaseHttpResponse.success(
        artistRequest,
        201,
        'Artist request submitted successfully'
      );
      
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getMyRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const artistRequest = await this.artistRequestService.getRequestByUserId(userId);
      console.log('artistRequest', artistRequest);
      const response = BaseHttpResponse.success(
        {artistRequest}
      );
      
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }


  async getRequestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { requestId } = req.params;
      if (!requestId) {
        throw new BadRequestException('Request ID is required');
      }

      const request = await this.artistRequestService.getRequestById(requestId);
      
      if (!request) {
        throw new NotFoundException('Artist request not found');
      }
      
      const response = BaseHttpResponse.success(
        request,
        200,
        'Artist request retrieved successfully'
      );
      
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateRequestStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { requestId } = req.params;
      const adminId = req.userId;
      
      if (!requestId) {
        throw new BadRequestException('Request ID is required');
      }
      
      if (!adminId) {
        throw new BadRequestException('Admin ID not available');
      }

      const statusData = req.validatedData;
      const updatedRequest = await this.artistRequestService.updateRequestStatus(requestId, adminId, statusData);
      
      const response = BaseHttpResponse.success(
        updatedRequest,
        200,
        `Artist request ${statusData.status} successfully`
      );
      
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}