import { Container } from "inversify";
import { BlogService } from "@/services/blog.service";
import { BlogController } from "@/controllers/blog.controller";
import { InteractionService } from "@/services/interaction.service";
import { TYPES } from "@/constants/types";
import { InteractionController } from "@/controllers/interaction.controller";
import { IBlogService, IBlogTagService, IInteractionService } from "@/interfaces/service.interface";
import { IBlogTagController, IInteractionController } from "@/interfaces/controller.interface";
import { IBlogController } from "@/interfaces/controller.interface";
import { BlogTagService } from "@/services/blog-tag.service";
import { BlogTagController } from "@/controllers/blog-tag.controller";

const container = new Container();

// Services
container.bind<IBlogTagService>(TYPES.BlogTagService).to(BlogTagService);
container.bind<IBlogService>(TYPES.BlogService).to(BlogService);
container.bind<IInteractionService>(TYPES.InteractionService).to(InteractionService);

// Controllers
container.bind<IBlogTagController>(TYPES.BlogTagController).to(BlogTagController);
container.bind<IBlogController>(TYPES.BlogController).to(BlogController); //chỉ dùng nội hàm interface
// container.bind<BlogController>(TYPES.BlogController).to(BlogController); //dùng toàn bộ class, kể cả hàm không có trong interface
container.bind<IInteractionController>(TYPES.InteractionController).to(InteractionController);
export default container;

