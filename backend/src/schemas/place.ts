import { z } from "zod";
import { Schema } from "mongoose";

export interface Location {
    lat: number;
    lng: number;
}

export interface Place {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    address: string;
    location: Location;
    creatorId: string;
}

export const PlaceDBSchema = new Schema<Place>({
    // Fields
    title: { type: String, required: true },
    description: { type: String, required: true, min: 10 },
    imageUrl: { type: String, required: false },
    address: { type: String, required: true, min: 1 },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    // Ids:
    creatorId: { type: String, required: true },
});

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
        .required(),
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
