import { TYPES } from '@/constants/types';
import { BlogController } from '@/controllers/blog.controller';
import { InteractionController } from '@/controllers/interaction.controller';
import {
	IBlogController,
	IInteractionController
} from '@/interfaces/controller.interface';
import {
	IBlogService,
	ICCCDService,
	IChatService,
	ICommentService,
	IInteractionService
} from '@/interfaces/service.interface';
import { BlogService } from '@/services/blog.service';
import { InteractionService } from '@/services/interaction.service';
import { Container } from 'inversify';
import 'reflect-metadata';

import { ArtworkController } from '@/controllers/artwork.controller';
// import {  } from '@/interfaces/controller.interface';
import BankRequestController from '@/controllers/bankrequest.controller';
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

import { CommentService } from "@/services/comment.service";
import { ChatController } from '@/controllers/chat.controller';
import { ChatService } from '@/services/chat.service';
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
import { AiService } from '@/services/ai.service';
import { ArtworkWarehouseController } from '@/controllers/artwork-warehouse.controller';
import { CCCDController } from '@/controllers/cccd.controller';
import { CCCDService } from '@/services/cccd.service';
import {PremiumService} from '@/services/premium.service';
import {PremiumController} from '@/controllers/premium.controller';
import { ArtistRequestService } from '@/services/artist-request.service';
import { ArtistRequestController } from '@/controllers/artist-request.controller';
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

// cccd
container.bind<ICCCDService>(TYPES.CCCDService).to(CCCDService);
container.bind<CCCDController>(TYPES.CCCDController).to(CCCDController);

// Chat
container.bind<IChatService>(TYPES.ChatService).to(ChatService);
container.bind<ChatController>(TYPES.ChatController).to(ChatController);


// ARTWORK
container.bind(Symbol.for('ArtworkService')).to(ArtworkService);
container.bind(Symbol.for('ArtworkController')).to(ArtworkController);

// COLLECTION
container
	.bind<CollectionService>(TYPES.CollectionService)
	.to(CollectionService);
container
	.bind<CollectionController>(TYPES.CollectionController)
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

container.bind(Symbol.for('AiService')).to(AiService);
container.bind<ArtworkWarehouseController>(TYPES.ArtworkWarehouseController).to(ArtworkWarehouseController);

//PREMIUM
container.bind<PremiumService>(Symbol.for('PremiumService')).to(PremiumService);
container.bind<PremiumController>(Symbol.for('PremiumController')).to(PremiumController);

//ARTIST REQUEST
container.bind<ArtistRequestService>(TYPES.ArtistRequestService).to(ArtistRequestService);
container.bind<ArtistRequestController>(TYPES.ArtistRequestController).to(ArtistRequestController);
export default container;
