import { Router } from 'express';
import roleRequire from '@/configs/middleware.config';
import { Role } from '@/constants/enum';
import { ReportController } from '@/controllers/report.controller';
import router from './artwork.router';
import { report } from 'process';

const reportRouter = Router();
const reportController = new ReportController();

reportRouter.get('/', roleRequire([Role.ADMIN]), reportController.get);
reportRouter.get('/:id', roleRequire(), reportController.getById);
reportRouter.get('/my-report/:reporterId', roleRequire(), reportController.getByReporterId);
reportRouter.post('/', roleRequire(), reportController.create);
reportRouter.put('/status/:id', roleRequire(), reportController.updateStatus);
reportRouter.put('/action/:id',roleRequire([Role.ADMIN]), reportController.action);
export default reportRouter;