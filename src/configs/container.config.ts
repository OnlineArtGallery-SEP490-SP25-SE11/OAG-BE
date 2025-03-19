import { TYPES } from '@/constants/types';
import { BlogController } from '@/controllers/blog.controller';
import { InteractionController } from '@/controllers/interaction.controller';
import {
	IArtworkController,
	IBlogController,
	ICollectionController,
	IInteractionController
} from '@/interfaces/controller.interface';
import {
	IBlogService,
	ICollectionService,
	ICommentService,
	IInteractionService
} from '@/interfaces/service.interface';
import { BlogService } from '@/services/blog.service';
import { InteractionService } from '@/services/interaction.service';
import { Container } from 'inversify';
import 'reflect-metadata';

import { ArtworkController } from '@/controllers/artwork.controller';
// import {  } from '@/interfaces/controller.interface';
import { BlogTagController } from "@/controllers/blog-tag.controller";
import { CollectionController } from '@/controllers/collection.controller.ts';
import { CommentController } from '@/controllers/comment.controller';
import { IBlogTagController } from "@/interfaces/controller.interface";
import { IBlogTagService } from "@/interfaces/service.interface";
import { ArtworkService } from '@/services/artwork.service.ts';
import { BlogTagService } from "@/services/blog-tag.service";
import { CollectionService } from '@/services/collection.service.ts';
import { CommentService } from '@/services/comment.service';

const container = new Container();

// Services
container.bind<IBlogTagService>(TYPES.BlogTagService).to(BlogTagService);
container.bind<IBlogService>(TYPES.BlogService).to(BlogService);
container
	.bind<IInteractionService>(TYPES.InteractionService)
	.to(InteractionService);

// Controllers
container.bind<IBlogTagController>(TYPES.BlogTagController).to(BlogTagController);
container.bind<IBlogController>(TYPES.BlogController).to(BlogController); //chỉ dùng nội hàm interface
// container.bind<BlogController>(TYPES.BlogController).to(BlogController); //dùng toàn bộ class, kể cả hàm không có trong interface
container
	.bind<IInteractionController>(TYPES.InteractionController)
	.to(InteractionController);

container.bind<ICommentService>(TYPES.CommentService).to(CommentService);
container.bind<CommentController>(TYPES.CommentController).to(CommentController);

// ARTWORK
// container.bind<IArtworkService>(TYPES.ArtworkService).to(ArtworkService);
container.bind(TYPES.ArtworkService).to(ArtworkService);
container
	.bind<IArtworkController>(TYPES.ArtworkController)
	.to(ArtworkController);

// COLLECTION
container
	.bind<ICollectionService>(TYPES.CollectionService)
	.to(CollectionService);
container
	.bind<ICollectionController>(TYPES.CollectionController)
	.to(CollectionController);
export default container;


// GALLERY
// In your container configuration
// container.bind<GalleryService>(TYPES.GalleryService).to(GalleryService);
// container.bind<GalleryController>(TYPES.GalleryController).to(GalleryController);