import authRouter from '@/routers/auth.router';
import userRouter from '@/routers/user.router';
import notificationRouter from '@/routers/notification.router';
import blogRouter from '@/routers/blog.router';
import fileRouter from '@/routers/file.router';
export default [
	{ path: '/api/auth', router: authRouter },
	{ path: '/api/user', router: userRouter },
	{ path: '/api/notification', router: notificationRouter },
	{ path: '/api/blog', router: blogRouter },
	{ path: '/api/upload', router: fileRouter }
];
