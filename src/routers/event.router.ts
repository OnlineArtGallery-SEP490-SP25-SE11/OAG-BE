import { Router } from 'express';
import roleRequire from '@/configs/middleware.config';
import { Role } from '@/constants/enum';
import { EventController } from '@/controllers/event.controller';
import { EventService } from '@/services/events.service';
import { validate } from '@/middlewares/validate.middleware.ts';
import { eventSchema } from '@/schemas/event.schema';
const router = Router();
const eventController = new EventController();


router.get('/', eventController.getEvents);
// router.get('/', eventController.get);
router.get('/:id', eventController.getEventById);
// router.post('/', roleRequire([Role.ADMIN]), eventController.createEvent);
router.post('/',roleRequire([Role.ADMIN]),validate(eventSchema), eventController.add);
router.put('/:id', roleRequire([Role.ADMIN]), eventController.update);
router.delete('/:id', roleRequire([Role.ADMIN]), eventController.deleteEvent);


export default router;