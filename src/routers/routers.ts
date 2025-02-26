import authRouter from '@/routers/auth.router';
import userRouter from '@/routers/user.router';
import notificationRouter from '@/routers/notification.router';
import blogRouter from '@/routers/blog.router';
import eventRouter from '@/routers/event.router';
import path from 'path';
import fileRouter from '@/routers/file.router';
import interactionRouter from '@/routers/interaction.router';
export default [
	{ path: '/api/auth', router: authRouter },
	{ path: '/api/user', router: userRouter },
	{ path: '/api/notification', router: notificationRouter },
	{ path: '/api/blog', router: blogRouter },
	{ path: '/api/event', router: eventRouter },
	{ path: '/api/upload', router: fileRouter },
  { path: "/api/interaction", router: interactionRouter }
];
