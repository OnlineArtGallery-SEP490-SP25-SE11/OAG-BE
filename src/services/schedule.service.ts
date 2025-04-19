import cron from 'node-cron';
import Event from '../models/event.model';
import { EventStatus } from '../constants/enum';
import Wallet from '../models/wallet.model'; // Add this import

export default class EventScheduleService {
  private dailyJob: cron.ScheduledTask;
  private hourlyJob: cron.ScheduledTask;
  private resetWithdrawLimitJob: cron.ScheduledTask; // Add this property

  constructor() {
    // Khởi tạo các cronjob
    this.dailyJob = cron.schedule('0 0 * * *', async () => {
      console.log('Đang chạy cronjob cập nhật trạng thái sự kiện hàng ngày');
      await this.updateEventStatus();
    });

    this.hourlyJob = cron.schedule('0 * * * *', async () => {
      console.log('Đang chạy cronjob cập nhật trạng thái sự kiện hàng giờ');
      await this.updateEventStatus();
    });
    
    // Thêm cronjob mới để reset totalWithdrawInDay hàng ngày lúc 00:00
    this.resetWithdrawLimitJob = cron.schedule('0 0 * * *', async () => {
      console.log('Đang chạy cronjob reset totalWithdrawInDay hàng ngày');
      await this.resetTotalWithdrawInDay();
    });
  }

  /**
   * Hàm cập nhật trạng thái của tất cả các sự kiện dựa trên ngày hiện tại
   */
  private async updateEventStatus() {
    const currentDate = new Date();
    
    try {
      // Cập nhật các sự kiện thành ONGOING
      const ongoingResult = await Event.updateMany(
        {
          startDate: { $lte: currentDate },
          endDate: { $gt: currentDate },
          status: { $ne: EventStatus.ONGOING }
        },
        { status: EventStatus.ONGOING }
      );
      
      // Cập nhật các sự kiện thành COMPLETED
      const completedResult = await Event.updateMany(
        {
          endDate: { $lte: currentDate },
          status: { $ne: EventStatus.COMPLETED }
        },
        { status: EventStatus.COMPLETED }
      );
      
      console.log(`Đã cập nhật sự kiện: ${ongoingResult.modifiedCount} thành ONGOING, ${completedResult.modifiedCount} thành COMPLETED`);
      return { ongoingUpdated: ongoingResult.modifiedCount, completedUpdated: completedResult.modifiedCount };
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái sự kiện:', error);
      throw error;
    }
  }

  /**
   * Hàm reset totalWithdrawInDay về 0 cho tất cả các ví
   */
  private async resetTotalWithdrawInDay() {
    try {
      const result = await Wallet.updateMany(
        { totalWithdrawInDay: { $gt: 0 } },
        { $set: { totalWithdrawInDay: 0 } }
      );
      
      console.log(`Đã reset totalWithdrawInDay về 0 cho ${result.modifiedCount} ví`);
      return { resetCount: result.modifiedCount };
    } catch (error) {
      console.error('Lỗi khi reset totalWithdrawInDay:', error);
      throw error;
    }
  }

  /**
   * Chạy cập nhật ngay lập tức
   */
  public async runImmediately() {
    console.log('Đang chạy cập nhật trạng thái sự kiện khi khởi động');
    return this.updateEventStatus();
  }

  /**
   * Dừng tất cả các cronjob
   */
  public stopAll() {
    this.dailyJob.stop();
    this.hourlyJob.stop();
    this.resetWithdrawLimitJob.stop(); // Add this line
    console.log('Đã dừng tất cả các cronjob cập nhật trạng thái sự kiện và reset totalWithdrawInDay');
  }
  
  /**
   * Chạy reset totalWithdrawInDay ngay lập tức
   */
  public async resetWithdrawLimitImmediately() {
    console.log('Đang chạy reset totalWithdrawInDay ngay lập tức');
    return this.resetTotalWithdrawInDay();
  }
}
