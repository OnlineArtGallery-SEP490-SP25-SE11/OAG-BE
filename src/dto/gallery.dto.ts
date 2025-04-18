import { z } from 'zod';
const vector3Schema = z.tuple([z.number(), z.number(), z.number()]);

const dimensionsSchema = z.object({
    xAxis: z.number().positive(),
    yAxis: z.number().positive(),
    zAxis: z.number().positive()
});

const artworkPlacementSchema = z.object({
    position: vector3Schema,
    rotation: vector3Schema
});


// Base collider schema
const baseColliderSchema = z.object({
    position: vector3Schema,
    rotation: vector3Schema,
    type: z.enum(['Static', 'Dynamic', 'Kinematic']).optional().default('Static'),
    visible: z.boolean().optional().default(true)
});

// Box collider specific schema
const boxColliderSchema = baseColliderSchema.extend({
    shape: z.literal('box'),
    args: vector3Schema
});

// Curved collider specific schema
const curvedColliderSchema = baseColliderSchema.extend({
    shape: z.literal('curved'),
    radius: z.number().positive(),
    height: z.number().positive(),
    segments: z.number().int().positive().optional().default(32),
    arc: z.number().min(0).max(Math.PI * 2).optional().default(Math.PI * 2)
});

// Combined collider schema using discriminated union
const customColliderSchema = z.discriminatedUnion('shape', [
    boxColliderSchema,
    curvedColliderSchema
]);

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
    previewImage: z.string().url(),
    isPremium: z.boolean(),
    isActive: z.boolean(),
    planImage: z.string().url(),
    customColliders: z.array(customColliderSchema).optional(),
    artworkPlacements: z.array(artworkPlacementSchema).optional()
});

export const updateGallerySchema = createGallerySchema.partial();

export type CreateGalleryDto = z.infer<typeof createGallerySchema>;
export type UpdateGalleryDto = z.infer<typeof updateGallerySchema>;