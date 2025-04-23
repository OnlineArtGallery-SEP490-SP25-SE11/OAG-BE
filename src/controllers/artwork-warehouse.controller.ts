import { Request, Response, NextFunction } from 'express';
import ArtworkWarehouseModel from '../models/artwork-warehouse.model';
import ArtworkModel from '../models/artwork.model';
import { injectable } from 'inversify';
import { BaseHttpResponse } from '@/lib/base-http-response';

@injectable()
export class ArtworkWarehouseController {
  constructor() {
    this.getArtworkWarehouse = this.getArtworkWarehouse.bind(this);
    this.downloadArtwork = this.downloadArtwork.bind(this);
  }

  /**
   * Lấy danh sách tranh đã mua
   */
  async getArtworkWarehouse(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.userId;
      const { page = 1, limit = 10, filter } = req.query;
      const pageNumber = Number(page);
      const limitNumber = Number(limit);
      
      // Xây dựng query
      const query: any = { userId };
      
      // Áp dụng filter
      if (filter === 'recent') {
        // Sắp xếp theo thời gian mua (mới nhất)
        query.purchasedAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }; // 7 ngày gần đây
      } else if (filter === 'downloaded') {
        // Đã tải ít nhất 1 lần
        query.downloadCount = { $gt: 0 };
      } else if (filter === 'not_downloaded') {
        // Chưa tải lần nào
        query.downloadCount = 0;
      }
      
      const total = await ArtworkWarehouseModel.countDocuments(query);
      
      const items = await ArtworkWarehouseModel.find(query)
        .populate({
          path: 'artworkId',
          select: 'title description url price dimensions',
          model: 'Artwork'
        })
        .populate({
          path: 'userId',
          select: 'name image',
          model: 'User'
        })
        .sort({ purchasedAt: -1 }) // Mới nhất trước
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);
      
      return res.status(200).json(
        BaseHttpResponse.success({
          items,
          total,
          page: pageNumber,
          limit: limitNumber
        }, 200, 'Lấy danh sách tranh đã mua thành công')
      );
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Tải ảnh đã mua
   */
  async downloadArtwork(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.userId;
      const warehouseItemId = req.params.id;
      
      // Kiểm tra xem item có tồn tại và thuộc về người dùng không
      const warehouseItem = await ArtworkWarehouseModel.findOne({
        _id: warehouseItemId,
        userId
      });
      
      if (!warehouseItem) {
        return res.status(404).json(
          BaseHttpResponse.error('Không tìm thấy tranh trong kho của bạn', 404)
        );
      }
      
      // Lấy thông tin artwork
      const artwork = await ArtworkModel.findById(warehouseItem.artworkId);
      
      if (!artwork) {
        return res.status(404).json(
          BaseHttpResponse.error('Không tìm thấy tranh', 404)
        );
      }
      
      // Cập nhật thông tin tải
      warehouseItem.downloadedAt = new Date();
      warehouseItem.downloadCount = (warehouseItem.downloadCount || 0) + 1;
      await warehouseItem.save();
      
      // Tạo tên file phù hợp
      const fileName = artwork.title.replace(/\s+/g, '_') + '.jpg';
      
      // Thiết lập header để tải xuống
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Trả về file ảnh hoặc URL tải
      return res.redirect(artwork.url);
    } catch (error) {
      next(error);
    }
  }
} 