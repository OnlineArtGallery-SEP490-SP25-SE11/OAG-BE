import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '@/constants/types';
import { BlogController } from '@/controllers/blog.controller';
import { InteractionController } from '@/controllers/interaction.controller';
import {
	IArtworkController,
	IBlogController,
	IChatController,
	ICollectionController,
	IInteractionController
} from '@/interfaces/controller.interface';
import {
	IBlogService,
	IChatService,
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
import { PaymentController } from '@/controllers/payment.controller';
import WalletController from '@/controllers/wallet.controller';
import { IBlogTagController } from "@/interfaces/controller.interface";
import { IBlogTagService } from "@/interfaces/service.interface";
import { ArtworkService } from '@/services/artwork.service.ts';
import BankRequestService from '@/services/bankrequest.service';
import { BlogTagService } from "@/services/blog-tag.service";
import { CollectionService } from '@/services/collection.service.ts';

import { CommentController } from "@/controllers/comment.controller";
import { CommentService } from "@/services/comment.service";
import { ChatController } from '@/controllers/chat.controller';
import { ChatService } from '@/services/chat.service';
import { CommentService } from '@/services/comment.service';
import { GalleryService } from '@/services/gallery.service';
import { GalleryController } from '@/controllers/gallery.controller';
import { IGalleryService } from '@/interfaces/service/gallery-service.interface';
import { IGalleryController } from '@/interfaces/controller/gallery-controller.interface';
import { IExhibitionService } from '@/interfaces/service/exhibition-service.interface';
import { IExhibitionController } from '@/interfaces/controller/exhibition-controller.interface';
import { ExhibitionService } from '@/services/exhibition.service';
import { ExhibitionController } from '@/controllers/exhibition.controller';
import { PaymentService } from '@/services/payment.service';
import WalletService from '@/services/wallet.service';
import BankRequestController from '@/controllers/bankrequest.controller';

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

// Chat
container.bind<IChatService>(TYPES.ChatService).to(ChatService);
container.bind<ChatController>(TYPES.ChatController).to(ChatController);


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


container.bind<PaymentService>(Symbol.for('PaymentService')).to(PaymentService);
container.bind<PaymentController>(Symbol.for('PaymentController')).to(PaymentController);
container.bind(Symbol.for('WalletService')).to(WalletService);
container.bind(Symbol.for('WalletController')).to(WalletController);
container.bind(Symbol.for('BankRequestService')).to(BankRequestService);
container.bind(Symbol.for('BankRequestController')).to(BankRequestController);
export default container;
