import { z } from "zod";
import { Types } from "mongoose";

export interface NewUser {
    name: string;
    email: string;
    password: string;
    imageUrl?: string;
    isAdmin: boolean;
}

export interface User extends NewUser {
    id: string;
    places: Types.ObjectId[];
}

export const UserPutSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().optional(),
});

export type UserPut = z.infer<typeof UserPutSchema>;
