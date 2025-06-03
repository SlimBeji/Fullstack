import { z } from "../../openapi";
import { Types } from "mongoose";

// Interfaces
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

// Zod Fields
export const userIdField = z.string().min(24).openapi({
    description: "The user ID, 24 characters",
    example: "683b21134e2e5d46978daf1f",
});

export const userNameField = z.string().min(2).openapi({
    description: "The user name, two characters at least",
    example: "Slim Beji",
});

export const userEmailField = z.string().email().openapi({
    description: "The user email",
    example: "mslimbeji@gmail.com",
});

export const userPasswordField = z.string().min(8).openapi({
    description: "The user password, 8 characters at least",
    example: "my_secret_password",
});

// Zod Schemas
export const UserPutSchema = z.object({
    name: userNameField.optional(),
    email: userEmailField.optional(),
    password: userPasswordField.optional(),
});

export type UserPut = z.infer<typeof UserPutSchema>;
