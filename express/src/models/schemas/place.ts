import { z } from "../../openapi";
import { Types } from "mongoose";

// Interfaces
export interface Location {
    lat: number;
    lng: number;
}

export interface NewPlace {
    title: string;
    description: string;
    imageUrl?: string;
    address: string;
    location?: Location;
}

export interface Place extends NewPlace {
    id: string;
    creatorId: Types.ObjectId;
}

// Zod Fields
export const placeTitleField = z.string().min(10).openapi({
    description: "The place title/name, 10 characters minimum",
    example: "Stamford Bridge",
});

export const placeDescriptionField = z.string().min(10).openapi({
    description: "The place description, 10 characters minimum",
    example: "Stadium of Chelsea football club",
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

export const placeCreatorId = z.string().min(24).openapi({
    description: "The ID of the place creator, 24 characters",
    example: "683b21134e2e5d46978daf1f",
});

// Zod Schemas
export const PlacePostSchema = z.object({
    title: placeTitleField,
    description: placeDescriptionField,
    address: placeAddressField,
    location: placeLocationField.optional(),
    creatorId: placeCreatorId,
});

export type PlacePostBody = z.infer<typeof PlacePostSchema>;

export type PlacePost = PlacePostBody & {
    imageUrl?: string;
};

export const PlacePutSchema = z.object({
    title: placeTitleField.optional(),
    description: placeDescriptionField.optional(),
    address: placeAddressField.optional(),
    location: placeLocationField.optional(),
});

export type PlacePut = z.infer<typeof PlacePutSchema>;
