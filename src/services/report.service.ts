// ReportService.ts
import logger from '@/configs/logger.config';
import Report from '../models/report.model';
import { getModelForClass } from '@typegoose/typegoose';
import {
	BadRequestException,
	InternalServerErrorException
} from '@/exceptions/http-exception';
import { ErrorCode } from '@/constants/error-code';
import { Types } from 'mongoose';
import { CouldNotFindBlogException } from '@/exceptions';
import { ReportStatus } from '../constants/enum';
import { actionReport } from '../constants/enum';
import User from '@/models/user.model';
import Blog from '@/models/blog.model';
import Artwork from '@/models/artwork.model';
import NotificationService from '@/services/notification.service';

export class ReportService {
	async get() {
		try {
			const reports = await Report.find();
			return reports;
		} catch (error) {
			logger.error(error, 'Error getting reports');
			throw new InternalServerErrorException(
				'Error getting report from database',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async getById(id: string): Promise<InstanceType<typeof Report> | null> {
		try {
			if (!Types.ObjectId.isValid(id)) {
				throw new BadRequestException(
					'Invalid report id',
					ErrorCode.INVALID_REPORT_ID
				);
			}
			const report = await Report.findById(id);
			if (!report) {
				throw new CouldNotFindBlogException();
			}
			return report;
		} catch (error) {
			logger.error(error, 'Error getting report by id');
			throw new InternalServerErrorException(
				'Error getting report by id from database',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async getByReporterId(
		reporterId: string
	): Promise<InstanceType<typeof Report>[]> {
		try {
			if (!Types.ObjectId.isValid(reporterId)) {
				throw new BadRequestException(
					'Invalid reporter id',
					ErrorCode.INVALID_REPORT_ID
				);
			}
			const reports = await Report.find({ reporterId });
			return reports;
		} catch (error) {
			logger.error(error, 'Error getting reports by reporterId');
			throw new InternalServerErrorException(
				'Error getting reports by reporterId from database',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	// Hàm create đã được điều chỉnh: thêm reporterId từ access token và các tham số theo thứ tự hợp lý
	async create(
		reporterId: string,
		refId: string,
		refType: string,
		reason: string,
		description: string,
		url: string,
		image: string[] // Nếu image truyền vào là mảng
	): Promise<InstanceType<typeof Report>> {
		try {
			if (!Types.ObjectId.isValid(refId)) {
				throw new Error('Invalid refId');
			}
			if (!Types.ObjectId.isValid(reporterId)) {
				throw new Error('Invalid reporterId');
			}

			// Determine reportedId based on refType
			let reportedId: string;
			console.log('cc');

			switch (refType.toLowerCase()) {
				case 'user':
					// If refType is user, reportedId is directly the refId
					const user = await User.findById(refId);
					if (!user) {
						throw new Error('User not found');
					}
					reportedId = refId;
					break;

				case 'blog':
					// If refType is blog, find the blog and get its userId/authorId
					const blog = await Blog.findById(refId);
					if (!blog) {
						throw new Error('Blog not found');
					}
					reportedId = blog.author.toString(); // Use appropriate field based on your model
					break;

				case 'artwork':
					const artwork = await Artwork.findById(refId);
					if (!artwork) {
						throw new Error('Artwork not found');
					}
					if (artwork.artistId === undefined) {
						throw new Error('ArtistId not found');
					}
					reportedId = artwork.artistId.toString(); // Use appropriate field based on your model
					break;

				default:
					throw new Error(`Unsupported refType: ${refType}`);
			}

			const report = new Report({
				reporterId, // Người báo cáo
				refId, // Người/entity bị báo cáo
				refType: refType.toLocaleUpperCase(), // Loại người/entity bị báo cáo
				reportedId, // ID của người bị báo cáo (được xác định dựa trên refType)
				reason, // Lý do báo cáo
				description, // Mô tả báo cáo
				status: ReportStatus.PENDING, // Mặc định là trạng thái chờ xử lý
				url, // URL liên quan đến báo cáo
				image
			});

			return await report.save();
		} catch (error) {
			logger.error(error, 'Error creating report');
			throw new InternalServerErrorException(
				'Error creating report',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async updateStatus(
		id: string,
		status: ReportStatus
	): Promise<InstanceType<typeof Report> | null> {
		try {
			if (!Types.ObjectId.isValid(id)) {
				const errorMessage = 'Invalid event id';
				logger.error(errorMessage);
				throw new Error(errorMessage);
			}
			const update = { status };

			// Add the update operation
			const updatedReport = await Report.findByIdAndUpdate(
				id,
				update,
				{ new: true } // Return the updated document instead of the original
			);

			if (!updatedReport) {
				logger.warn(`Report with id ${id} not found`);
				return null;
			}

			logger.info(
				`Successfully updated status of report ${id} to ${status}`
			);
			return updatedReport;
		} catch (error) {
			logger.error(error, 'Error updating report status');
			throw new InternalServerErrorException(
				'Error updating report status',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	async action(
		id: string,
		action: actionReport
	): Promise<InstanceType<typeof Report> | null> {
		try {
			if (!Types.ObjectId.isValid(id)) {
				const errorMessage = 'Invalid report id';
				logger.error(errorMessage);
				throw new Error(errorMessage);
			}

			// Find the report by id
			const report = await Report.findById(id);
			if (!report) {
				logger.warn(`Report with id ${id} not found`);
				return null;
			}

			// Find the user by reportedId from the report
			const reportedUserId = report.reportedId;
			logger.info(`Reported user id: ${reportedUserId}`);
			const actionUser = await User.findByIdAndUpdate(
				reportedUserId,
				{ action },
				{ new: true }
			);

			if (!actionUser) {
				logger.warn(`User with id ${reportedUserId} not found`);
				return null;
			}

			// Update the report status to RESOLVED
			report.status = ReportStatus.RESOLVED;
			const updatedReport = await report.save();

			logger.info(
				`Successfully updated action of user ${reportedUserId} to ${action}`
			);
			logger.info(
				`Successfully updated status of report ${id} to RESOLVED`
			);
			return updatedReport;
		} catch (error) {
			logger.error(error, 'Error action report');
			throw new InternalServerErrorException(
				'Error action report',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	//ban
	async permanentBan(
		reportId: string
	): Promise<InstanceType<typeof User> | null> {
		try {
			if (!Types.ObjectId.isValid(reportId)) {
				throw new BadRequestException(
					'Invalid report id',
					ErrorCode.INVALID_REPORT_ID
				);
			}

			// Find the report first
			const report = await Report.findById(reportId);
			if (!report) {
				logger.warn(`Report with id ${reportId} not found`);
				return null;
			}

			// Get the reportedId from the report
			const reportedUserId = report.reportedId;
			if (!reportedUserId) {
				logger.warn(`Report with id ${reportId} has no reportedId`);
				return null;
			}

			// Ban the reported user
			const user = await User.findByIdAndUpdate(
				reportedUserId,
				{ isBanned: true },
				{ new: true } // Return the updated document
			);

			if (!user) {
				logger.warn(`User with id ${reportedUserId} not found`);
				return null;
			}

			// Update all reports involving this user to RESOLVED
			await Report.updateMany(
				{ reportedId: reportedUserId },
				{ status: ReportStatus.RESOLVED }
			);
			await NotificationService.createNotification({
				title: 'Account Permanently Banned',
				content:
					'Your account has been permanently banned due to policy violations. Contact support for more information.',
				userId: reportedUserId.toString(),
				isSystem: true,
				refType: 'ban',
				refId: reportId
			});
			logger.info(
				`Successfully banned user ${reportedUserId} permanently from report ${reportId}`
			);
			return user;
		} catch (error) {
			logger.error(error, 'Error permanently banning user');
			throw new InternalServerErrorException(
				'Error permanently banning user',
				ErrorCode.DATABASE_ERROR
			);
		}
	}

	//banned by time (fixed 30 days)
	async temporaryBan(
		reportId: string
	): Promise<InstanceType<typeof User> | null> {
		try {
			if (!Types.ObjectId.isValid(reportId)) {
				throw new BadRequestException(
					'Invalid report id',
					ErrorCode.INVALID_REPORT_ID
				);
			}

			// Find the report first
			const report = await Report.findById(reportId);
			if (!report) {
				logger.warn(`Report with id ${reportId} not found`);
				return null;
			}

			// Get the reportedId from the report
			const reportedUserId = report.reportedId;
			if (!reportedUserId) {
				logger.warn(`Report with id ${reportId} has no reportedId`);
				return null;
			}

			// Set fixed ban period to 30 days
			const banPeriod = 0.0007; ///test 1' 0.0007

			// Ban the reported user
			const user = await User.findByIdAndUpdate(
				reportedUserId,
				{
					isBanned: true,
					banExpiresAt: new Date(
						Date.now() + banPeriod * 24 * 60 * 60 * 1000
					) // Set expiration date (30 days)
				},
				{ new: true }
			);

			if (!user) {
				logger.warn(`User with id ${reportedUserId} not found`);
				return null;
			}

			// Update all reports involving this user to RESOLVED
			await Report.updateMany(
				{ reportedId: reportedUserId },
				{ status: ReportStatus.RESOLVED }
			);

			// Send notification about temporary ban
			await NotificationService.createNotification({
				title: 'Account Temporarily Banned',
				content: `Your account has been temporarily banned for ${banPeriod} days due to policy violations. Contact support for more information.`,
				userId: reportedUserId.toString(),
				isSystem: true,
				refType: 'ban',
				refId: reportId
			});
			
			
			// Calculate when to unban (30 days in milliseconds)
			const unbanTime = banPeriod * 24 * 60 * 60 * 1000;

			// Schedule the unban task
			setTimeout(async () => {
				try {
					// Unban the user after 30 days
					const unbannedUser = await User.findByIdAndUpdate(
						reportedUserId,
						{ isBanned: false, banExpiresAt: null },
						{ new: true }
					);

					if (unbannedUser) {
						logger.info(
							`User ${reportedUserId} has been automatically unbanned after ${banPeriod} days`
						);
						
						// Send notification about the account being unbanned
						await NotificationService.createNotification({
							title: 'Account Unbanned',
							content: 'Your account ban period has ended and your account is now active.',
							userId: reportedUserId.toString(),
							isSystem: true,
							refType: 'ban',
							refId: reportId
						});
					} else {
						logger.warn(
							`Failed to unban user ${reportedUserId}: User not found`
						);
					}
				} catch (error) {
					logger.error(
						error,
						`Error unbanning user ${reportedUserId}`
					);
				}
			}, unbanTime);

			logger.info(
				`Successfully temporarily banned user ${reportedUserId} for ${banPeriod} days from report ${reportId}`
			);
			return user;
		} catch (error) {
			logger.error(error, 'Error temporarily banning user');
			throw new InternalServerErrorException(
				'Error temporarily banning user',
				ErrorCode.DATABASE_ERROR
			);
		}
	}
}
