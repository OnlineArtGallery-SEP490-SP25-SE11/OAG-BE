import { z } from 'zod';
import { ExhibitionStatus } from '@/constants/enum';

// Schema definitions for nested objects
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
  ).optional().default([]),
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

// Minimal schema for initial creation - only requires gallery ID
export const createEmptyExhibitionSchema = z.object({
  gallery: z.string(),
  name: z.string().min(2).max(50).optional()
});

// Complete schema for exhibitions with all possible fields
const exhibitionCompleteSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  gallery: z.string(),
  languageOptions: z.array(languageOptionSchema),
  isFeatured: z.boolean().optional().default(false),
  status: z.nativeEnum(ExhibitionStatus),
  result: resultSchema,
  public: publicSchema,
  artworkPositions: z.array(artworkPositionSchema)
});

// Update schema - all fields optional
export const updateExhibitionSchema = exhibitionCompleteSchema.partial();

// Types for use in controllers and services
export type CreateEmptyExhibitionDto = z.infer<typeof createEmptyExhibitionSchema>;
export type UpdateExhibitionDto = z.infer<typeof updateExhibitionSchema>;