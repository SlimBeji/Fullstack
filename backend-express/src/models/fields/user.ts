import { zod } from "@/lib/zod";

import { zodFile, zodObjectId } from "./utils";

//////// Types ///////

export const userSelectableFields = [
    "id",
    "name",
    "email",
    "isAdmin",
    "imageUrl",
    "places",
];

export type UserSelectableType = (typeof userSelectableFields)[number];

export const userSearchableFields = ["id", "name", "email"];

export type UserSearchableType = (typeof userSearchableFields)[number];

export const userSortableFields = [
    "createdAt",
    "-createdAt",
    "name",
    "-name",
    "email",
    "-email",
];

export type UserSortableType = (typeof userSortableFields)[number];

//////// First Level Fields ///////

const id = zodObjectId().openapi({
    description: "The user ID, 24 characters",
    example: "683b21134e2e5d46978daf1f",
});

const name = zod.string().min(2).openapi({
    description: "The user name, two characters at least",
    example: "Slim Beji",
});

const email = zod.string().email().openapi({
    description: "The user email",
    example: "mslimbeji@gmail.com",
});

const password = zod.string().min(8).openapi({
    description: "The user password, 8 characters at least",
    example: "very_secret",
});

const imageUrl = zod.string().openapi({
    type: "string",
    example: "avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg",
    description: "local url on the storage",
});

const image = zodFile("User's profile image (JPEG)");

const isAdmin = zod.coerce.boolean().openapi({
    description: "Whether the user is an admin or not",
    example: false,
});

const places = zod.array(
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
