import { Container } from 'inversify';
import 'reflect-metadata';
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

import { ArtworkController } from '@/controllers/artwork.controller';
import { BlogTagController } from "@/controllers/blog-tag.controller";
import { CollectionController } from '@/controllers/collection.controller.ts';
import { CommentController } from '@/controllers/comment.controller';
import { IBlogTagController } from "@/interfaces/controller.interface";
import { IBlogTagService } from "@/interfaces/service.interface";
import { ArtworkService } from '@/services/artwork.service.ts';
import { BlogTagService } from "@/services/blog-tag.service";
import { CollectionService } from '@/services/collection.service.ts';
import { CommentService } from '@/services/comment.service';
import { GalleryService } from '@/services/gallery.service';
import { GalleryController } from '@/controllers/gallery.controller';
import { IGalleryService } from '@/interfaces/service/gallery-service.interface';
import { IGalleryController } from '@/interfaces/controller/gallery-controller.interface';
import { IExhibitionService } from '@/interfaces/service/exhibition-service.interface';
import { IExhibitionController } from '@/interfaces/controller/exhibition-controller.interface';
import { ExhibitionService } from '@/services/exhibition.service';
import { ExhibitionController } from '@/controllers/exhibition.controller';

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

// GALLERY
container.bind<IGalleryService>(TYPES.GalleryService).to(GalleryService);
container.bind<IGalleryController>(TYPES.GalleryController).to(GalleryController);

// EXHIBITION
container.bind<IExhibitionService>(TYPES.ExhibitionService).to(ExhibitionService);
container.bind<IExhibitionController>(TYPES.ExhibitionController).to(ExhibitionController);


export default container;