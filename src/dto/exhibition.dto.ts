/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod';
import { ExhibitionStatus } from '@/constants/enum';

// Schema definitions for nested objects
const languageOptionSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(2).max(2),
  isDefault: z.boolean()
});

const resultSchema = z.object({
  visits: z.number().optional().default(0),
  likes: z.array(
    z.object({
      count: z.number(),
      artwork: z.string(),
      userId: z.string()
    })
  ).optional().default([]),
  totalTime: z.number().optional().default(0)
});


const artworkPositionSchema = z.object({
  artwork: z.string(),
  positionIndex: z.number()
});

const ticketSchema = z.object({
  requiresPayment: z.boolean().default(false),
  price: z.number().default(0),
  registeredUsers: z.array(z.string()).default([]),
  // currency: z.string().optional(),
});



// Minimal schema for initial creation - only requires gallery ID
export const createEmptyExhibitionSchema = z.object({
  gallery: z.string(),
});



// Complete schema for exhibitions with all possible fields
const exhibitionCompleteSchema = z.object({
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  welcomeImage: z.string().url(),
  backgroundMedia: z.string().url().optional(),
  backgroundAudio: z.string().url().optional(),
  contents: z.array(z.object({
    languageCode: z.string().min(2).max(2),
    name: z.string().max(100).default(''),
    description: z.string().default(''),
  })),
  gallery: z.string(),
  languageOptions: z.array(languageOptionSchema),
  isFeatured: z.boolean().optional().default(false),
  status: z.nativeEnum(ExhibitionStatus),
  result: resultSchema,
  linkName: z.string(),
  discovery: z.boolean(),
  artworkPositions: z.array(artworkPositionSchema),
  ticket: ticketSchema,
});

// Update schema - all fields optional
export const updateExhibitionSchema = exhibitionCompleteSchema.partial();

//RejectExhibitionSchema
export const rejectExhibitionSchema = z.object({
  reason: z.string().min(1),
});


export const likeArtworkSchema = z.object({
  artworkId: z.string().min(1, 'Artwork ID is required')
});

export type LikeArtworkDto = z.infer<typeof likeArtworkSchema>;

export interface LikeArtworkResponse {
  liked: boolean;
  likesCount: number;
  artworkId: string;
}

export const updateExhibitionAnalyticsSchema = z.object({
  totalTime: z.number()
});

export type UpdateExhibitionAnalyticsDto = z.infer<typeof updateExhibitionAnalyticsSchema>;

// Types for use in controllers and services
export type CreateEmptyExhibitionDto = z.infer<typeof createEmptyExhibitionSchema>;
export type UpdateExhibitionDto = z.infer<typeof updateExhibitionSchema>;

// Interface for ticket purchase response
export type TicketPurchaseResponse = {
  exhibitionId: string;
  exhibitionName: string;
  purchaseDate: Date;
  price: number;
  status: 'COMPLETED';
}



const SORT_FIELDS = [
  'createdAt',
  'startDate',
  'endDate',
  'result.visits',
  'result.totalTime'
] as const;

// Define allowed sort orders
const SORT_ORDERS = [-1, 1] as const;

// Create sort field validation
const sortFieldSchema = z.enum(SORT_FIELDS);
const sortOrderSchema = z.enum(['-1', '1']).transform(val => parseInt(val));

// Validate sort object
const sortSchema = z.record(sortFieldSchema, sortOrderSchema);

// Define filter fields validation
const filterSchema = z.object({
  discovery: z.boolean().optional(),
  status: z.nativeEnum(ExhibitionStatus).optional(),
  startDate: z.object({
    $gte: z.string().datetime().optional(),
    $lte: z.string().datetime().optional()
  }).optional(),
  endDate: z.object({
    $gte: z.string().datetime().optional(),
    $lte: z.string().datetime().optional()
  }).optional(),
  isFeatured: z.boolean().optional(),
  gallery: z.string().optional(),
  author: z.string().optional()
}).strict(); // This ensures no additional fields are allowed


export interface ExhibitionQueryDto {
  page?: number;
  limit?: number;
  sort?: z.infer<typeof sortSchema>;
  filter?: z.infer<typeof filterSchema>;
  search?: string;
  status?: ExhibitionStatus;
}

export const exhibitionQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sort: z.string()
    .transform((str) => {
      try {
        return JSON.parse(str);
      } catch {
        throw new Error('Invalid JSON in sort parameter');
      }
    })
    .pipe(sortSchema)
    .optional(),
  filter: z.string()
    .transform((str) => {
      try {
        return JSON.parse(str);
      } catch {
        throw new Error('Invalid JSON in filter parameter');
      }
    })
    .pipe(filterSchema)
    .optional(),
  search: z.string().optional(),
  status: z.nativeEnum(ExhibitionStatus).optional()
});