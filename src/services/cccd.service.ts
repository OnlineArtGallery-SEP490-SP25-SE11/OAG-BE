import { injectable } from "inversify";
import CCCDModel, { CCCDDocument } from "@/models/cccd.model";
import { Types } from "mongoose";
import { ICCCDService } from "@/interfaces/service.interface";
import logger from "@/configs/logger.config";
import { InternalServerErrorException } from "@/exceptions/http-exception";
import { ErrorCode } from "@/constants/error-code";

@injectable()
export class CCCDService implements ICCCDService {
    async findAll(options: {
    page?: number;
    limit?: number;
    sort?: Record<string, 1 | -1>;
    filter?: Record<string, any>;
    search?: string;
  }): Promise<{
    cccd: CCCDDocument[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 },
        filter = {},
        search
      } = options;

      // Build query filters
      const query: Record<string, any> = { ...filter };

      // Add search functionality
      if (search) {
        query.$or = [
          { id: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { 'address.detail': { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel for better performance
      const [cccd, total] = await Promise.all([
        CCCDModel.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate({
            path: 'user',
            select: 'name email image',
            model: 'User'
          })
          .lean(),
        CCCDModel.countDocuments(query)
      ]);

      // Calculate pagination info
      const pages = Math.ceil(total / limit);
      const hasNext = page < pages;
      const hasPrev = page > 1;

      return {
        cccd: cccd as CCCDDocument[],
        pagination: {
          total,
          page,
          limit,
          pages,
          hasNext,
          hasPrev
        }
      };
    } catch (error) {
      logger.error('Error finding CCCD:', error);
      throw new InternalServerErrorException(
        'Error finding CCCD records',
        ErrorCode.DATABASE_ERROR
      );
    }
  }
  async createCCCD(data: any): Promise<CCCDDocument> {
    const cccd = new CCCDModel(data);
    return await cccd.save();
  }

  async getCCCDById(cccdId: string): Promise<CCCDDocument | null> {
    return await CCCDModel.findById(new Types.ObjectId(cccdId));
  }

  async getCccdByUserId(userId: string): Promise<CCCDDocument | null> {
    return await CCCDModel.findOne({ user: new Types.ObjectId(userId) });
  }

  async updateCCCD(cccdId: string, data: any): Promise<CCCDDocument | null> {
    return await CCCDModel.findByIdAndUpdate(
      new Types.ObjectId(cccdId),
      { $set: data },
      { new: true }
    );
  }

  async deleteCCCD(cccdId: string): Promise<void> {
    await CCCDModel.findByIdAndDelete(new Types.ObjectId(cccdId));
  }
}
