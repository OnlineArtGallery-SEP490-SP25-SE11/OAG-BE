import { BaseHttpResponse } from "@/lib/base-http-response";
import { ForbiddenException } from "@/exceptions/http-exception";
import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/constants/types";
import { CCCDService } from "@/services/cccd.service";
import { CreateCccdDto, UpdateCccdDto } from "../dto/cccd.dto";

@injectable()
export class CCCDController {
  constructor(
    @inject(TYPES.CCCDService) private readonly cccdService: CCCDService
  ) {
    this.create = this.create.bind(this);
    this.getCCCDById = this.getCCCDById.bind(this);
    this.getCCCDByUserId = this.getCCCDByUserId.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  // Tạo CCCD mới
  create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const data = req.validatedData as CreateCccdDto;
      const cccd = await this.cccdService.createCCCD(data);
      const response = BaseHttpResponse.success(cccd, 201, "CCCD created successfully");
      return res.status(response.statusCode).json(response.data);
    } catch (error) {
      next(error);
    }
  };

  // Lấy CCCD theo ID
  getCCCDById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const cccdId = req.params.id;
      const cccd = await this.cccdService.getCCCDById(cccdId);
      if (!cccd) throw new ForbiddenException("CCCD not found");
      const response = BaseHttpResponse.success(cccd, 200, "CCCD fetched successfully");
      return res.status(response.statusCode).json(response.data);
    } catch (error) {
      next(error);
    }
  };

  // Lấy CCCD theo User ID
  getCCCDByUserId = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const userId = req.params.userId;
      const cccd = await this.cccdService.getCccdByUserId(userId);
      if (!cccd) throw new ForbiddenException("CCCD not found for this user");
      const response = BaseHttpResponse.success(cccd, 200, "CCCD fetched successfully");
      return res.status(response.statusCode).json(response.data);
    } catch (error) {
      next(error);
    }
  };

  // Cập nhật CCCD
  update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const cccdId = req.params.id;
      const data = req.validatedData as UpdateCccdDto;
      const updatedCCCD = await this.cccdService.updateCCCD(cccdId, data);
      if (!updatedCCCD) throw new ForbiddenException("CCCD not found");
      const response = BaseHttpResponse.success(updatedCCCD, 200, "CCCD updated successfully");
      return res.status(response.statusCode).json(response.data);
    } catch (error) {
      next(error);
    }
  };

  // Xóa CCCD
  delete = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const cccdId = req.params.id;
      await this.cccdService.deleteCCCD(cccdId);
      const response = BaseHttpResponse.success(null, 204, "CCCD deleted successfully");
      return res.status(response.statusCode).json(response.data);
    } catch (error) {
      next(error);
    }
  };
}
