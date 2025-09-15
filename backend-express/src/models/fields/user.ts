import z from "../../zodExt";
import { zodFile, zodObjectId } from "./utils";

//////// Types ///////

export type UserSelectableFields =
    | "id"
    | "name"
    | "email"
    | "isAdmin"
    | "imageUrl"
    | "places";

export type UserSearchableFields = "id" | "name" | "email";

export type UserSortableFields =
    | "createdAt"
    | "-createdAt"
    | "name"
    | "-name"
    | "email"
    | "-email";

//////// First Level Fields ///////

const id = zodObjectId().openapi({
    description: "The user ID, 24 characters",
    example: "683b21134e2e5d46978daf1f",
});

const name = z.string().min(2).openapi({
    description: "The user name, two characters at least",
    example: "Slim Beji",
});

const email = z.string().email().openapi({
    description: "The user email",
    example: "mslimbeji@gmail.com",
});

const password = z.string().min(8).openapi({
    description: "The user password, 8 characters at least",
    example: "very_secret",
});

const imageUrl = z.string().openapi({
    type: "string",
    example: "avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg",
    description: "local url on the storage",
});

const image = zodFile("User's profile image (JPEG)");

const isAdmin = z.coerce.boolean().openapi({
    description: "Whether the user is an admin or not",
    example: false,
});

const places = z.array(
    zodObjectId().openapi({
        description: "The id of places belonging to the user, 24 characters",
        example: "683b21134e2e5d46978daf1f",
    })
);

export const UserFields = {
    id,
    name,
    email,
    password,
    imageUrl,
    image,
    isAdmin,
    places,
};
