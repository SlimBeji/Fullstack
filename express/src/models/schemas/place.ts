import { z, zodObjectId } from "../../zod";
import { buildPaginatedSchema, buildPaginationSchema } from "./utils";

// Zod Fields
export const placeIdField = zodObjectId().openapi({
    description: "The ID of the place 24 characters",
    example: "683b21134e2e5d46978daf1f",
});

export const placeTitleField = z.string().min(10).openapi({
    description: "The place title/name, 10 characters minimum",
    example: "Stamford Bridge",
});

export const placeDescriptionField = z.string().min(10).openapi({
    description: "The place description, 10 characters minimum",
    example: "Stadium of Chelsea football club",
});

export const placeImageUrlField = z.string().openapi({
    type: "string",
    description: "local url on the storage",
});

export const placeImageField = z.string().openapi({
    type: "string",
    format: "binary",
    description: "Place image (JPEG)",
});

export const placeAddressField = z.string().min(1).openapi({
    description: "The place address",
    example: "Fulham road",
});

export const placeLocationField = z.object({
    lat: z.number().openapi({
        description: "The latitude of the place",
        example: 51.48180425016331,
    }),
    lng: z.number().openapi({
        description: "The longitude of the place",
        example: -0.19090418688755467,
    }),
});

export const placeCreatorIdField = zodObjectId().openapi({
    description: "The ID of the place creator, 24 characters",
    example: "683b21134e2e5d46978daf1f",
});

// DB Schemas
export const PlaceDBSchema = z.object({
    title: placeTitleField,
    description: placeDescriptionField,
    imageUrl: placeImageUrlField.optional(),
    address: placeAddressField,
    location: placeLocationField.optional(),
    creatorId: placeCreatorIdField,
});

export type PlaceDB = z.infer<typeof PlaceDBSchema>;

// Seed Schemas
export const PlaceSeedSchema = PlaceDBSchema.omit({ creatorId: true });

export type PlaceSeed = z.infer<typeof PlaceSeedSchema>;

// Creation Schemas

export const PlaceCreateSchema = PlaceDBSchema.extend({});

export type PlaceCreate = z.infer<typeof PlaceCreateSchema>;

// Post Schemas
export const PlacePostSchema = PlaceCreateSchema.omit({
    imageUrl: true,
}).extend({ image: placeImageField });

export type PlacePost = z.infer<typeof PlacePostSchema>;

// Read Schemas

export const PlaceReadSchema = PlaceDBSchema.extend({
    id: placeIdField,
});

export type PlaceRead = z.infer<typeof PlaceReadSchema>;

export const PlacesPaginatedSchema = buildPaginatedSchema(PlaceReadSchema);

export type PlacesPaginated = z.infer<typeof PlacesPaginatedSchema>;

// Query Schemas
export const PlaceSortableFields = [
    "createdAt",
    "title",
    "description",
    "address",
    "location",
];

export const PlaceSearchSchema = z.object({
    title: placeTitleField.optional(),
    description: placeDescriptionField.optional(),
    address: placeAddressField.optional(),
    location: placeLocationField.optional(),
});

export type PlaceSearch = z.infer<typeof PlaceSearchSchema>;

export const PlaceSearchSwagger = buildPaginationSchema(
    PlaceSearchSchema,
    PlaceSortableFields
);

// Put Schemas
export const PlacePutSchema = PlaceSearchSchema.extend({});

export type PlacePut = z.infer<typeof PlacePutSchema>;
