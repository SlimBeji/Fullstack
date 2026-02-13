import { env } from "@/config";
import { FindQuery } from "@/lib/types";
import {
    filtersSchema,
    httpFilters,
    paginatedSchema,
    zod,
    zodFile,
    ZodInfer,
    zodObject,
} from "@/lib/zod_";

import { createdAt, updatedAt } from "./common";

// --- Fields ----

export const placeSelectableFields = [
    "id",
    "title",
    "description",
    "address",
    "location.lat",
    "location.lng",
    "imageUrl",
    "creatorId",
] as const;

export type PlaceSelectableType = (typeof placeSelectableFields)[number];

export const placeSearchableFields = [
    "id",
    "title",
    "description",
    "address",
    "creatorId",
    "locationLat",
    "locationLng",
] as const;

export type PlaceSearchableType = (typeof placeSearchableFields)[number];

export const placeSortableFields = [
    "createdAt",
    "-createdAt",
    "title",
    "-title",
    "description",
    "-description",
    "address",
    "-address",
] as const;

export type PlaceSortableType = (typeof placeSortableFields)[number];

const id = zod.coerce.number().openapi({
    description: "The ID of the place 24 characters",
    example: 123456789,
});

const title = zod.string().min(10).openapi({
    description: "The place title/name, 10 characters minimum",
    example: "Stamford Bridge",
});

const description = zod.string().min(10).openapi({
    description: "The place description, 10 characters minimum",
    example: "Stadium of Chelsea football club",
});

const embedding = zod.array(zod.number()).length(384).openapi({
    description: "Title + Description embedding",
});

const imageUrl = zod.string().openapi({
    type: "string",
    example: "avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg",
    description: "local url on the storage",
});

const image = zodFile("Place Image (JPEG)", env.FILEUPLOAD_MAX_SIZE);

const address = zod.string().min(1).openapi({
    description: "The place address",
    example: "Fulham road",
});

const creatorId = zod.coerce.number().openapi({
    description: "The ID of the place creator, 24 characters",
    example: 123456,
});

const lat = zod.coerce.number().openapi({
    description: "The latitude of the place",
    example: 51.48180425016331,
});

const lng = zod.coerce.number().openapi({
    description: "The longitude of the place",
    example: -0.19090418688755467,
});

const location = zodObject({ lat, lng }).openapi({
    description: "Location object (can be sent as JSON string)",
});

export const PlaceFields = {
    id,
    title,
    description,
    embedding,
    imageUrl,
    image,
    address,
    creatorId,
    lat,
    lng,
    location,
};

// --- Base Schemas ----
export const PlaceDBSchema = zod.object({
    id: PlaceFields.id,
    title: PlaceFields.title,
    description: PlaceFields.description,
    embedding: PlaceFields.embedding.optional(),
    imageUrl: PlaceFields.imageUrl.optional(),
    address: PlaceFields.address,
    location: PlaceFields.location,
    creatorId: PlaceFields.creatorId,
});

export type PlaceDB = ZodInfer<typeof PlaceDBSchema>;

export type PlaceSeed = Omit<PlaceDB, "id" | "creatorId"> & {
    _ref: number;
    _createorRef: number;
};

// --- Creation Schemas ----

export const PlaceCreateSchema = PlaceDBSchema.omit({
    id: true,
    embedding: true,
});

export type PlaceCreate = ZodInfer<typeof PlaceCreateSchema>;

export const PlacePostSchema = PlaceCreateSchema.omit({
    imageUrl: true,
    location: true,
}).extend({
    lat: PlaceFields.lat,
    lng: PlaceFields.lng,
    image: PlaceFields.image.optional(),
});

export type PlacePost = ZodInfer<typeof PlacePostSchema>;

// ---  Read Schemas ----

export const PlaceReadSchema = PlaceDBSchema.omit({ embedding: true }).extend({
    createdAt,
    updatedAt,
});

export type PlaceRead = ZodInfer<typeof PlaceReadSchema>;

export const PlacesPaginatedSchema = paginatedSchema(PlaceReadSchema);

export type PlacesPaginated = ZodInfer<typeof PlacesPaginatedSchema>;

// ---  Quey Schemas ----

export const PlaceFiltersSchema = filtersSchema(
    zod.object({
        id: httpFilters(PlaceFields.id, {
            example: "683b21134e2e5d46978daf1f",
        }).optional(),
        title: httpFilters(PlaceFields.title, {
            example: "eq:Some Place",
        }).optional(),
        description: httpFilters(PlaceFields.description, {
            example: "regex:football",
        }).optional(),
        address: httpFilters(PlaceFields.address, {
            example: "regex:d{1,2} Boulevard",
        }).optional(),
        locationLat: httpFilters(PlaceFields.lat, {
            example: "gt:3.5",
        }).optional(),
        locationLng: httpFilters(PlaceFields.lng, {
            example: "lt:4.5",
        }).optional(),
        creatorId: httpFilters(
            PlaceFields.creatorId,
            {
                example: "eq:683b21134e2e5d46978daf1f",
            },
            { isIndex: true }
        ).optional(),
    }),
    placeSortableFields,
    placeSelectableFields,
    env.MAX_ITEMS_PER_PAGE
);

export type PlaceFilters = ZodInfer<typeof PlaceFiltersSchema>;

export type PlaceFindQuery = FindQuery<
    PlaceSelectableType,
    PlaceSortableType,
    PlaceSearchableType
>;

// --- Update Schemas ---

export const PlaceUpdateSchema = zod.object({
    title: PlaceFields.title.optional(),
    description: PlaceFields.description.optional(),
    address: PlaceFields.address.optional(),
    location: PlaceFields.location.optional(),
    creatorId: PlaceFields.creatorId.optional(),
});

export type PlaceUpdate = ZodInfer<typeof PlaceUpdateSchema>;

export const PlacePutSchema = PlaceUpdateSchema.extend({});

export type PlacePut = ZodInfer<typeof PlacePutSchema>;
