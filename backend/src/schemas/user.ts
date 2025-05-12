import { z } from "zod";
import { Types } from "mongoose";

export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    imageUrl?: string;
    isAdmin: boolean;
    places: Types.ObjectId[];
}

export const UserPutSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().optional(),
});

export type UserPut = z.infer<typeof UserPutSchema>;
