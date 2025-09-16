import { FindQuery } from "../../types";
import z from "../../zodExt";
import {
    httpFilters,
    PlaceFields,
    PlaceSearchableType,
    placeSelectableFields,
    PlaceSelectableType,
    placeSortableFields,
    PlaceSortableType,
} from "../fields";
import { filtersSchema, paginatedSchema } from "./base";

// --- Base Schemas ----
export const PlaceDBSchema = z.object({
    id: PlaceFields.id,
    title: PlaceFields.title,
    description: PlaceFields.description,
    embedding: PlaceFields.embedding.optional(),
    imageUrl: PlaceFields.imageUrl.optional(),
    address: PlaceFields.address,
    location: PlaceFields.location,
    creatorId: PlaceFields.creatorId,
});

export type PlaceDB = z.infer<typeof PlaceDBSchema>;

export type PlaceSeed = Omit<PlaceDB, "id" | "creatorId"> & {
    _ref: number;
    _createorRef: number;
};

// --- Creation Schemas ----

export const PlaceCreateSchema = PlaceDBSchema.omit({
    id: true,
    embedding: true,
});

export type PlaceCreate = z.infer<typeof PlaceCreateSchema>;

export const PlacePostSchema = PlaceCreateSchema.omit({
    imageUrl: true,
}).extend({ image: PlaceFields.image.optional() });

export type PlacePost = z.infer<typeof PlacePostSchema>;

// ---  Read Schemas ----

export const PlaceReadSchema = PlaceDBSchema.omit({ embedding: true });

export type PlaceRead = z.infer<typeof PlaceReadSchema>;

export const PlacesPaginatedSchema = paginatedSchema(PlaceReadSchema);

export type PlacesPaginated = z.infer<typeof PlacesPaginatedSchema>;

// ---  Quey Schemas ----

export const PlaceFiltersSchema = filtersSchema(
    z.object({
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
    placeSelectableFields
);

export type PlaceFilters = z.infer<typeof PlaceFiltersSchema>;

export type PlaceFindQuery = FindQuery<
    PlaceSelectableType,
    PlaceSortableType,
    PlaceSearchableType
>;

// --- Update Schemas ---

export const PlaceUpdateSchema = z.object({
    title: PlaceFields.title.optional(),
    description: PlaceFields.description.optional(),
    address: PlaceFields.address.optional(),
    location: PlaceFields.location.optional(),
    creatorId: PlaceFields.creatorId.optional(),
});

export type PlaceUpdate = z.infer<typeof PlaceUpdateSchema>;

export const PlacePutSchema = PlaceUpdateSchema.extend({});

export type PlacePut = z.infer<typeof PlacePutSchema>;
