import artworkRouter from '@/routers/artwork.router';
import authRouter from '@/routers/auth.router';
import blogRouter from '@/routers/blog.router';
import collectionRouter from '@/routers/collection.router';
import fileRouter from '@/routers/file.router';
import interactionRouter from '@/routers/interaction.router';
import notificationRouter from '@/routers/notification.router';
import userRouter from '@/routers/user.router';
import eventRouter from '@/routers/event.router';
import blogTagRouter from '@/routers/blog-tag.router';
import commentRoute from '@/routers/comment.route';
import chatRoute from '@/routers/chat.route';

import paymentRouter from '@/routers/payment.router';
export default [
	{ path: '/api/auth', router: authRouter },
	{ path: '/api/user', router: userRouter },
	{ path: '/api/notification', router: notificationRouter },
	{ path: '/api/blog', router: blogRouter },
	{ path: '/api/upload', router: fileRouter },
	{ path: '/api/interaction', router: interactionRouter },
	{ path: '/api/artwork', router: artworkRouter },
	{ path: '/api/collection', router: collectionRouter },
	{ path: '/api/event', router: eventRouter },
	{ path: '/api/interaction', router: interactionRouter },
	{ path: '/api/blog-tag', router: blogTagRouter },
	{ path: '/api/comments', router: commentRoute},
	{ path: '/api/chat', router: chatRoute},
	{ path: '/api/payment', router: paymentRouter },
];
