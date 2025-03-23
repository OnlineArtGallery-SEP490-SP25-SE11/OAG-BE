import { z } from 'zod';
import { GalleryStatus } from '@/constants/enum';

const languageOptionSchema = z.object({
    name: z.string().min(2).max(2),
    code: z.string().min(2).max(2),
    isDefault: z.boolean()
});

const resultSchema = z.object({
    visits: z.number().optional().default(0),
    likes: z.array(
        z.object({
            count: z.number(),
            artworkId: z.string()
        })
    ).optional(),
    totalTime: z.number().optional().default(0)
});

const publicSchema = z.object({
    linkName: z.string().optional().default(''),
    discovery: z.boolean().optional().default(false)
});

const artworkPositionSchema = z.object({
    artworkId: z.string(),
    positionIndex: z.number()
});


// Base schema for common properties
const exhibitionBaseSchema = z.object({
    name: z.string().min(2).max(50),
    description: z.string().optional(),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    artworks: z.array(z.string()),
    languageOptions: z.array(languageOptionSchema),
    isFeatured: z.boolean().optional().default(false),
    status: z.nativeEnum(GalleryStatus),
    result: resultSchema,
    public: publicSchema,
    artworkPositions: z.array(artworkPositionSchema).optional()
});


// Create exhibition schema - required for POST
export const createExhibitionSchema = exhibitionBaseSchema
    .extend({
        author: z.string()
    });

// Update exhibition schema - all fields optional for PATCH/PUT
export const updateExhibitionSchema = exhibitionBaseSchema
    .partial()
    .extend({
        author: z.string().optional()
    });

// Types for use in controllers and services
export type CreateExhibitionDto = z.infer<typeof createExhibitionSchema>;
export type UpdateExhibitionDto = z.infer<typeof updateExhibitionSchema>;