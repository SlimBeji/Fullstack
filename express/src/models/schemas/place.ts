import {
    z,
    zodObjectId,
    zodFile,
    zodObject,
    zodQueryParam,
    buildPaginatedSchema,
    buildSearchSchema,
} from "./zod";

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

export const placeEmbeddingField = z.array(z.number()).length(384).openapi({
    description: "Title + Description embedding",
});

export const placeImageUrlField = z.string().openapi({
    type: "string",
    description: "local url on the storage",
});

export const placeImageField = zodFile("User's profile image (JPEG)");

export const placeAddressField = z.string().min(1).openapi({
    description: "The place address",
    example: "Fulham road",
});

export const locationLatField = z.coerce.number().openapi({
    description: "The latitude of the place",
    example: 51.48180425016331,
});

export const locationLngField = z.coerce.number().openapi({
    description: "The longitude of the place",
    example: -0.19090418688755467,
});

export const placeLocationField = zodObject({
    lat: locationLatField,
    lng: locationLngField,
}).openapi({
    description: "Location object (can be sent as JSON string)",
});

export const placeCreatorIdField = zodObjectId().openapi({
    description: "The ID of the place creator, 24 characters",
    example: "683b21134e2e5d46978daf1f",
});

// DB Schemas
export const PlaceDBSchema = z.object({
    id: placeIdField,
    title: placeTitleField,
    description: placeDescriptionField,
    embedding: placeEmbeddingField.optional(),
    imageUrl: placeImageUrlField.optional(),
    address: placeAddressField,
    location: placeLocationField.optional(),
    creatorId: placeCreatorIdField,
});

export type PlaceDB = z.infer<typeof PlaceDBSchema>;

export type PlaceSeed = Omit<PlaceDB, "id" | "creatorId"> & {
    _ref: number;
    _createorRef: number;
};

// Creation Schemas

export const PlaceCreateSchema = PlaceDBSchema.omit({ id: true });

export type PlaceCreate = z.infer<typeof PlaceCreateSchema>;

// Post Schemas
export const PlacePostSchema = PlaceCreateSchema.omit({
    imageUrl: true,
}).extend({ image: placeImageField.optional() });

export type PlacePost = z.infer<typeof PlacePostSchema>;

// Read Schemas

export const PlaceReadSchema = PlaceDBSchema.extend({});

export type PlaceRead = z.infer<typeof PlaceReadSchema>;

export const PlacesPaginatedSchema = buildPaginatedSchema(PlaceReadSchema);

export type PlacesPaginated = z.infer<typeof PlacesPaginatedSchema>;

// Query Schemas
export const PlaceSortableFields = [
    "createdAt",
    "title",
    "description",
    "address",
];

export const PlaceFiltersSchema = z.object({
    title: zodQueryParam(placeTitleField, {
        example: "eq:Some Place",
    }).optional(),
    description: zodQueryParam(placeDescriptionField, {
        example: "regex:football",
    }).optional(),
    address: zodQueryParam(placeAddressField, {
        example: "regex:d{1,2} Boulevard",
    }).optional(),
    "location.lat": zodQueryParam(locationLatField, {
        example: "gt:3.5",
    }).optional(),
    "location.lng": zodQueryParam(locationLatField, {
        example: "lt:4.5",
    }).optional(),
    creatorId: zodQueryParam(placeCreatorIdField, {
        example: "eq:683b21134e2e5d46978daf1f",
    }).optional(),
});

export const PlaceSearchGetSchema = buildSearchSchema(
    PlaceFiltersSchema,
    PlaceSortableFields
);

export type PlaceSearchGet = z.infer<typeof PlaceSearchGetSchema>;

export const PlaceSearchPostSchema = buildSearchSchema(
    PlaceFiltersSchema,
    PlaceSortableFields,
    PlaceReadSchema
);

export type PlaceSearchPost = z.infer<typeof PlaceSearchPostSchema>;

// Update Schemas

export const PlaceUpdateSchema = z.object({
    title: placeTitleField.optional(),
    description: placeDescriptionField.optional(),
    address: placeAddressField.optional(),
    location: placeLocationField.optional(),
    creatorId: placeCreatorIdField.optional(),
});

export type PlaceUpdate = z.infer<typeof PlaceUpdateSchema>;

// Put Schemas
export const PlacePutSchema = PlaceUpdateSchema.extend({});

export type PlacePut = z.infer<typeof PlacePutSchema>;
