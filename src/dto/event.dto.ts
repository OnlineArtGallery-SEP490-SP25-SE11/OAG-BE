import { z } from 'zod';

export const CreateEventSchema = z.object({
    title: z.string().min(5).max(100).nonempty(),
    description: z.string().min(10).max(1000),
    type: z.string().min(5).max(100).nonempty(),
    status: z.string().min(5).max(100).nonempty(),
    organizer: z.string(),
    participants: z.array(z.object({
        userId: z.string(),
        role: z.string(),
        joinedAt: z.string()
    })),
    userId: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
});

export const UpdateEventSchema = z.object({
    _id: z.string().optional(),
    title: z.string().min(5).max(100).optional(),
    description: z.string().min(10).max(1000).optional(),
    type: z.string().min(5).max(100).optional(),
    status: z.string().min(5).max(100).optional(),
    organizer: z.string().optional(),
    participants: z.array(z.object({
        userId: z.string(),
        role: z.string(),
        joinedAt: z.string()
    })).optional(),
    userId: z.string().optional(),
});

export const CreateEventPayload = z.object({
    title: z.string().min(5).max(100).nonempty(),
    description: z.string().min(10).max(1000),
    type: z.string().min(5).max(100).nonempty(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.string().min(5).max(100).nonempty(),
    organizer: z.string(),
    participants: z.array(z.object({
        userId: z.string(),
        role: z.string(),
        joinedAt: z.string()
    })).optional(),
});
export type CreateEventDto = z.infer<typeof CreateEventSchema>;
export type UpdateEventDto = z.infer<typeof UpdateEventSchema>;
