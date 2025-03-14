import cron from 'node-cron';
import Event from '../models/event.model';
import { EventStatus } from '../constants/enum';

export default class EventScheduleService {
  private dailyJob: cron.ScheduledTask;
  private hourlyJob: cron.ScheduledTask;

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
    console.log('Đã dừng tất cả các cronjob cập nhật trạng thái sự kiện');
  }
}
