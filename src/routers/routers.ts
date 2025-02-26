import authRouter from '@/routers/auth.router';
import blogRouter from '@/routers/blog.router';
import fileRouter from '@/routers/file.router';
import interactionRouter from '@/routers/interaction.router';
import notificationRouter from '@/routers/notification.router';
import userRouter from '@/routers/user.router';
import blogTagRouter from '@/routers/blog-tag.router';

export default [
	{ path: '/api/auth', router: authRouter },
	{ path: '/api/user', router: userRouter },
	{ path: '/api/notification', router: notificationRouter },
	{ path: '/api/blog', router: blogRouter },
	{ path: '/api/upload', router: fileRouter },
	{ path: "/api/interaction", router: interactionRouter },
	{ path: '/api/blog-tag', router: blogTagRouter }
];
