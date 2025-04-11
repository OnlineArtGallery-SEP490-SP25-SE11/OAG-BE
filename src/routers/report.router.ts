import { Router } from 'express';
import roleRequire, {permanentBan} from '@/configs/middleware.config';
import { Role } from '@/constants/enum';
import { ReportController } from '@/controllers/report.controller';

const reportRouter = Router();
const reportController = new ReportController();
reportRouter.get('/', roleRequire([Role.ADMIN]), reportController.get);
reportRouter.get('/:id', roleRequire([Role.ADMIN]), reportController.getById);
reportRouter.get('/my-report/:reporterId', roleRequire(), reportController.getByReporterId);
reportRouter.post('/', roleRequire(), reportController.create);
reportRouter.put('/status/:id', roleRequire(), reportController.updateStatus);
reportRouter.put('/permanent-ban/:id',roleRequire([Role.ADMIN]), reportController.permanentBan);
reportRouter.put('/temporary-ban/:id',roleRequire([Role.ADMIN]), reportController.temporaryBan);
export default reportRouter;