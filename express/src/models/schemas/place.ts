import { z } from "../../zod";
import { Types } from "mongoose";
import { buildPaginatedSchema } from "./utils";

// Zod Fields
export const placeIdField = z.string().min(24).openapi({
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

export const placeCreatorIdField = z.string().min(24).openapi({
    description: "The ID of the place creator, 24 characters",
    example: "683b21134e2e5d46978daf1f",
});

// Place Schemas
export const NewPlaceSchema = z.object({
    title: placeTitleField,
    description: placeDescriptionField,
    imageUrl: placeImageUrlField.optional(),
    address: placeAddressField,
    location: placeLocationField.optional(),
});

export type NewPlace = z.infer<typeof NewPlaceSchema>;

export const PlaceSchema = NewPlaceSchema.extend({
    id: placeIdField,
    creatorId: placeCreatorIdField,
});

export type Place = z.infer<typeof PlaceSchema> & {
    creatorId: Types.ObjectId;
};

// Post Schemas
export const PlacePostSchema = z.object({
    title: placeTitleField,
    description: placeDescriptionField,
    address: placeAddressField,
    location: placeLocationField.optional(),
    creatorId: placeCreatorIdField,
});

export type PlacePostBody = z.infer<typeof PlacePostSchema>;

export type PlacePost = PlacePostBody & {
    imageUrl?: string;
};

// Put Schemas
export const PlacePutSchema = z.object({
    title: placeTitleField.optional(),
    description: placeDescriptionField.optional(),
    address: placeAddressField.optional(),
    location: placeLocationField.optional(),
});

export type PlacePut = z.infer<typeof PlacePutSchema>;

// Search Schemas
export const PlaceSearchSchema = PlacePutSchema.extend({});

export type PlaceSearch = z.infer<typeof PlaceSearchSchema>;

export const PlaceSortableFields = [
    "title",
    "description",
    "address",
    "location",
];

export const PlacePaginated = buildPaginatedSchema(PlaceSchema);
