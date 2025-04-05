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
      artwork: z.string()
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

// Types for use in controllers and services
export type CreateEmptyExhibitionDto = z.infer<typeof createEmptyExhibitionSchema>;
export type UpdateExhibitionDto = z.infer<typeof updateExhibitionSchema>;