import { Container } from 'inversify';
import { PaymentService } from '@/services/payment.service';
import { PaymentController } from '@/controllers/payment.controller';
import { TYPES } from '@/types/payment.types';

const container = new Container();

container.bind<PaymentService>(TYPES.PaymentService).to(PaymentService);
container.bind<PaymentController>(TYPES.PaymentController).to(PaymentController);

export { container };