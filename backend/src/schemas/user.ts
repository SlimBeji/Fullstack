import { z } from "zod";
import { Types, Schema } from "mongoose";
import { CollectionEnum } from "./enums";

export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    imageUrl?: string;
    isAdmin: boolean;
    places: Types.ObjectId[];
}

export const UserDBSchema = new Schema<User>({
    // Fields
    name: { type: String, required: true, unique: true, min: 2 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, min: 8 },
    imageUrl: { type: String, required: false },
    isAdmin: { type: Boolean, required: true, default: false },
    // Relations
    places: [
        {
            type: Schema.ObjectId,
            required: true,
            ref: CollectionEnum.PLACE,
        },
    ],
});

export const UserPutSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().optional(),
    imageUrl: z.string().url().optional(),
});

export type UserPut = z.infer<typeof UserPutSchema>;
