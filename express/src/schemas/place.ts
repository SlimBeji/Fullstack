import { z } from "zod";
import { Types } from "mongoose";

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

export const PlacePostSchema = z.object({
    title: z.string().min(10),
    description: z.string().min(10),
    imageUrl: z.string().url().optional(),
    address: z.string().min(1),
    location: z
        .object({
            lat: z.number(),
            lng: z.number(),
        })
        .optional(),
    creatorId: z.string().min(24),
});

export type PlacePost = z.infer<typeof PlacePostSchema>;

export const PlacePutSchema = z.object({
    title: z.string().min(10).optional(),
    description: z.string().min(10).optional(),
    imageUrl: z.string().url().optional(),
    address: z.string().min(5).optional(),
    location: z
        .object({
            lat: z.number(),
            lng: z.number(),
        })
        .optional(),
});

export type PlacePut = z.infer<typeof PlacePutSchema>;
