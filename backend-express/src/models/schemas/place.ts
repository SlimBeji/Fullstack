import { env } from "@/config";
import { FindQuery } from "@/lib/types";
import {
    filtersSchema,
    httpFilters,
    paginatedSchema,
    zod,
    ZodInfer,
} from "@/lib/zod";

import {
    PlaceFields,
    PlaceSearchableType,
    placeSelectableFields,
    PlaceSelectableType,
    placeSortableFields,
    PlaceSortableType,
} from "../fields";

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

export const PlaceReadSchema = PlaceDBSchema.omit({ embedding: true });

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
            { isObjectId: true }
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
