import { Router } from 'express';
import roleRequire from '@/configs/middleware.config';
import { Role } from '@/constants/enum';
import { EventController } from '@/controllers/event.controller';
import { EventService } from '@/services/events.service';

const router = Router();
const eventService = new EventService();
const eventController = new EventController(eventService);

router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.post('/', roleRequire([Role.ADMIN]), (req, res, next) => {
    eventController.createEvent(req, res, next);

});
router.put('/:id', roleRequire([Role.ADMIN]), eventController.updateEvent);
router.delete('/:id', roleRequire([Role.ADMIN]), eventController.deleteEvent);


export default router;