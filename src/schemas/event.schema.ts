
import { z } from 'zod';
import { EventStatus } from '@/constants/enum';
export const eventSchema = z.object({
    title: z.string().min(5).max(100).nonempty(),
    description: z.string().min(10).max(1000),
    type: z.string().min(5).max(100).nonempty(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.nativeEnum(EventStatus),
    organizer: z.string(),
    image: z.string().url().nonempty(),
    link: z.string().url().nonempty(),
});
