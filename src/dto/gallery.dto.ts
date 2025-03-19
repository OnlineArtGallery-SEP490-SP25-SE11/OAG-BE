import { z } from 'zod';
const vector3Schema = z.array(z.number()).length(3);

const dimensionsSchema = z.object({
    xAxis: z.number().positive(),
    yAxis: z.number().positive(),
    zAxis: z.number().positive()
});

const artworkPlacementSchema = z.object({
    position: vector3Schema,
    rotation: vector3Schema
});

export const createGallerySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    dimensions: dimensionsSchema,
    wallThickness: z.number().positive(),
    wallHeight: z.number().positive(),
    modelPath: z.string().url(),
    modelScale: z.number().positive(),
    modelRotation: vector3Schema.optional(),
    modelPosition: vector3Schema.optional(),
    previewImage: z.string().url().optional(),
    customColliders: z.array(z.array(z.number())).optional(),
    artworkPlacements: z.array(artworkPlacementSchema).optional()
});

export const updateGallerySchema = createGallerySchema.partial();

export type CreateGalleryDto = z.infer<typeof createGallerySchema>;
export type UpdateGalleryDto = z.infer<typeof updateGallerySchema>;