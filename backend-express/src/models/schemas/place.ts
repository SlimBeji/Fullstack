import { env } from "@/config";
import { SearchQuery } from "@/lib/types";
import {
    filtersSchema,
    getFieldsSectionSchema,
    httpFilters,
    paginatedSchema,
    zod,
    zodFile,
    ZodInfer,
    zodObject,
} from "@/lib/zod_";

import { createdAt } from "./common";

// --- Fields ----

const id = zod.coerce.number().openapi({
    description: "The ID of the place",
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
    description: "image url",
});

const image = zodFile("Place Image (JPEG)", env.FILEUPLOAD_MAX_SIZE);

const address = zod.string().min(1).openapi({
    description: "The place address",
    example: "Fulham road",
});

const creatorId = zod.coerce.number().openapi({
    description: "The ID of the place creator",
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

// --- Selectables, Serchables, Sortables ----

export const placeSelectableFields = [
    "id",
    "title",
    "description",
    "address",
    "location",
    "image_url",
    "creator_id",
    "created_at",
] as const;

export type PlaceSelectableType = (typeof placeSelectableFields)[number];

export const placeSearchableFields = [
    "id",
    "title",
    "description",
    "address",
    "creator_id",
    "location_lat",
    "location_lng",
] as const;

export type PlaceSearchableType = (typeof placeSearchableFields)[number];

export const placeSortableFields = [
    "created_at",
    "-created_at",
    "title",
    "-title",
    "description",
    "-description",
    "address",
    "-address",
] as const;

export type PlaceSortableType = (typeof placeSortableFields)[number];

// --- Base Schemas ----

export const PlaceDBSchema = zod.object({
    id: PlaceFields.id,
    title: PlaceFields.title,
    description: PlaceFields.description,
    embedding: PlaceFields.embedding.optional(),
    image_url: PlaceFields.imageUrl.optional(),
    address: PlaceFields.address,
    location: PlaceFields.location,
    creator_id: PlaceFields.creatorId,
});

export type PlaceDB = ZodInfer<typeof PlaceDBSchema>;

export type PlaceSeed = Omit<PlaceDB, "id" | "creator_id"> & {
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
    image_url: true,
    location: true,
}).extend({
    lat: PlaceFields.lat,
    lng: PlaceFields.lng,
    image: PlaceFields.image.optional(),
});

export type PlacePost = ZodInfer<typeof PlacePostSchema>;

// ---  Read Schemas ----

export const PlaceReadSchema = PlaceDBSchema.omit({ embedding: true }).extend({
    created_at: createdAt,
});

export type PlaceRead = ZodInfer<typeof PlaceReadSchema>;

export const PlaceGetSchema = zod.object({
    fields: getFieldsSectionSchema(placeSelectableFields, ["id", "location"]),
});

// --- Update Schemas ---

export const PlaceUpdateSchema = zod.object({
    title: PlaceFields.title.optional(),
    description: PlaceFields.description.optional(),
    address: PlaceFields.address.optional(),
    location: PlaceFields.location.optional(),
});

export type PlaceUpdate = ZodInfer<typeof PlaceUpdateSchema>;

export const PlacePutSchema = PlaceUpdateSchema.extend({});

export type PlacePut = ZodInfer<typeof PlacePutSchema>;

// ---  Search Schemas ----

export const PlacesPaginatedSchema = paginatedSchema(PlaceReadSchema);

export const PlaceSearchSchema = filtersSchema(
    zod.object({
        id: httpFilters(PlaceFields.id, "index", {
            example: 123456789,
            description: "The ID of the place",
        }).optional(),
        title: httpFilters(PlaceFields.title, "string", {
            example: "eq:Some Place",
            description: "The place title/name, 10 characters minimum",
        }).optional(),
        description: httpFilters(PlaceFields.description, "string", {
            example: "like:football",
            description: "The place description, 10 characters minimum",
        }).optional(),
        address: httpFilters(PlaceFields.address, "string", {
            example: "ilike:boulevard",
            description: "The place address",
        }).optional(),
        location_lat: httpFilters(PlaceFields.lat, "numeric", {
            example: "gt:3.5",
            description: "The latitude of the place",
        }).optional(),
        location_lng: httpFilters(PlaceFields.lng, "numeric", {
            example: "lt:4.5",
            description: "The longitude of the place",
        }).optional(),
        creator_id: httpFilters(PlaceFields.creatorId, "index", {
            example: "in:123456789",
            description: "The ID of the place creator",
        }).optional(),
        created_at: httpFilters(createdAt, "datetime", {
            example: "gt:2022-05-29",
            description: "creation datetime",
        }).optional(),
    }),
    placeSortableFields,
    placeSelectableFields,
    env.MAX_ITEMS_PER_PAGE,
    ["id", "location"]
);

export type PlaceSearch = ZodInfer<typeof PlaceSearchSchema>;

export type PlaceSearchQuery = SearchQuery<
    PlaceSelectableType,
    PlaceSortableType,
    PlaceSearchableType
>;
