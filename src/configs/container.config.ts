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
	IArtworkService,
	IBlogService,
	ICollectionService,
	IInteractionService
} from '@/interfaces/service.interface';
import { BlogService } from '@/services/blog.service';
import { InteractionService } from '@/services/interaction.service';
import { Container } from 'inversify';
import 'reflect-metadata';

import { ArtworkController } from '@/controllers/artwork.controller';
// import {  } from '@/interfaces/controller.interface';
import { ArtworkService } from '@/services/artwork.service.ts';
import { CollectionService } from '@/services/collection.service.ts';
import { CollectionController } from '@/controllers/collection.controller.ts';

const container = new Container();

// Services
container.bind<IBlogService>(TYPES.BlogService).to(BlogService);

// Controllers
container.bind<IBlogController>(TYPES.BlogController).to(BlogController); //chỉ dùng nội hàm interface
// container.bind<BlogController>(TYPES.BlogController).to(BlogController); //dùng toàn bộ class, kể cả hàm không có trong interface
container
	.bind<IInteractionController>(TYPES.InteractionController)
	.to(InteractionController);

// ARTWORK
container
	.bind<IInteractionService>(TYPES.InteractionService)
	.to(InteractionService);
container.bind<IArtworkService>(TYPES.ArtworkService).to(ArtworkService);
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
