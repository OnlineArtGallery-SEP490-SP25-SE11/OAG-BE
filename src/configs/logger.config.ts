import { colorize } from '@/utils/console.util';
import pino from 'pino';
import { pinoHttp } from 'pino-http';

// const stream = pretty({
//   colorize: true, // Màu sắc đầu ra
//   singleLine: true, // Hiển thị trên một dòng
//   translateTime: 'SYS:standard', // Hiển thị thời gian
//   ignore: 'pid,hostname', // Bỏ qua các trường không cần thiết
// });

const logger = pino({
	level: 'debug', //default: info
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true, // Màu sắc
			translateTime: true, // Hiển thị thời gian đẹp (ví dụ: 2024-11-18 12:30:45)
			ignore: 'pid,hostname' // Bỏ qua pid và hostname
		}
	}
});

export const pinoHttpOptions = pinoHttp({
	transport: {
		target: 'pino-pretty',
		options: {
			translateTime: 'HH:MM:ss',
			colorize: true,
			// singleLine: true,
			ignore: 'pid,hostname'
		}
	},
	customLogLevel: (req, res, err) => {
		if (err) return 'error';
		if (res.statusCode && res.statusCode >= 500) return 'error';
		if (res.statusCode && res.statusCode >= 400) return 'warn';
		return 'info';
	},
	serializers: {
		req: (req) => `[${req.method}] - ${req.url}`,
		res: (res) => `${res.statusCode || 'unknown'}`,
		responseTime: (responseTime) => `${responseTime}ms`
	},
	customAttributeKeys: {
		req: 'req',
		res: 'res',
		responseTime: 'responseTime'
	},
	customSuccessMessage: () => {
		return colorize('Request completed: ', '32');
	},
	customErrorMessage: (_req, _res, err) => {
		return colorize(`Request errored: ${err.message}`, '31');
	}
	// autoLogging: false, // Tắt log tự động
	// customProps: (req, res) => {
	//   const start = process.hrtime();
	//   res.on('finish', () => {
	//     const diff = process.hrtime(start);
	//     const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;
	//     const method = colorize(`[${req.method}]`, '32');
	//     const url = colorize(`${req.url}`, '36');
	//     const statusCode = colorize(`${res.statusCode || 'unknown'}`, '33');
	//     const time = colorize(`${responseTime.toFixed(3)}ms`, '35');
	//     logger.info(`${method} - ${url} - ${statusCode} - ${time}`);
	//   });
	//   return {};
	// },
	// stream,
});

export default logger;
