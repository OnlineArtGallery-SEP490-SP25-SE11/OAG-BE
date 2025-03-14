import { z } from 'zod';

export const CreateEventSchema = z.object({
    title: z.string().min(5).max(100).nonempty(),
    description: z.string().min(10).max(1000),
    type: z.string().min(5).max(100).nonempty(),
    status: z.string().min(5).max(100).nonempty(),
    organizer: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    image: z.string().url().nonempty(),
});

export const UpdateEventSchema = z.object({
    _id: z.string().optional(),
    title: z.string().min(5).max(100).optional(),
    description: z.string().min(10).max(1000).optional(),
    type: z.string().min(5).max(100).optional(),
    status: z.string().min(5).max(100).optional(),
    organizer: z.string().optional(),
    image: z.string().url().nonempty(),
});

export const CreateEventPayload = z.object({
    title: z.string().min(5).max(100).nonempty(),
    description: z.string().min(10).max(1000),
    type: z.string().min(5).max(100).nonempty(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.string().min(5).max(100).nonempty(),
    organizer: z.string(),
    image: z.string().url().nonempty(),
});
export type CreateEventDto = z.infer<typeof CreateEventSchema>;
export type UpdateEventDto = z.infer<typeof UpdateEventSchema>;
