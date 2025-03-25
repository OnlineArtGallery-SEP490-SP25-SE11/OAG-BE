import { Container } from 'inversify';
import { PaymentService } from '@/services/payment.service';
import { PaymentController } from '@/controllers/payment.controller';
import { TYPES } from '@/types/payment.types';
import { ArtistService } from '@/services/artist.service';
import { ArtistController } from '@/controllers/artist.controller';


const container = new Container();

container.bind<ArtistService>(TYPES.ArtistService).to(ArtistService);
container.bind<ArtistController>(TYPES.ArtistController).to(ArtistController);


export { container };