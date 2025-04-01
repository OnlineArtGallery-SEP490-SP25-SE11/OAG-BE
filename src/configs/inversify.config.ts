import { Container } from 'inversify';
import { PaymentService } from '@/services/payment.service';
import { PaymentController } from '@/controllers/payment.controller';
import { TYPES } from '@/types/payment.types';
import { ArtistService } from '@/services/artist.service';
import { ArtistController } from '@/controllers/artist.controller';
import { ArtworkService } from '@/services/artwork.service';
import { ArtworkController } from '@/controllers/artwork.controller';
import WalletService from '@/services/wallet.service';
import  WalletController  from '@/controllers/wallet.controller';

const container = new Container();

container.bind<ArtistService>(TYPES.ArtistService).to(ArtistService);
container.bind<ArtistController>(TYPES.ArtistController).to(ArtistController);
container.bind<ArtworkService>(TYPES.ArtworkService).to(ArtworkService);
container.bind<ArtworkController>(TYPES.ArtworkController).to(ArtworkController);
container.bind<WalletService>(TYPES.WalletService).to(WalletService);
container.bind<WalletController>(TYPES.WalletController).to(WalletController);
export { container };