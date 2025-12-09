import { zod } from "@/lib/zod";

import { zodFile, zodObject, zodObjectId } from "./utils";

//////// Types ///////

export const placeSelectableFields = [
    "id",
    "title",
    "description",
    "address",
    "location.lat",
    "location.lng",
    "imageUrl",
    "creatorId",
];

export type PlaceSelectableType = (typeof placeSelectableFields)[number];

export const placeSearchableFields = [
    "id",
    "title",
    "description",
    "address",
    "creatorId",
    "locationLat",
    "locationLng",
];

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
];

export type PlaceSortableType = (typeof placeSortableFields)[number];

//////// First Level Fields ///////
const id = zodObjectId().openapi({
    description: "The ID of the place 24 characters",
    example: "683b21134e2e5d46978daf1f",
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

const image = zodFile("Place Image (JPEG)");

const address = zod.string().min(1).openapi({
    description: "The place address",
    example: "Fulham road",
});

const creatorId = zodObjectId().openapi({
    description: "The ID of the place creator, 24 characters",
    example: "683b21134e2e5d46978daf1f",
});

//////// Location Fields ///////
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
