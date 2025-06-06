import { z, zodObjectId } from "../../zod";
import { buildPaginatedSchema, buildPaginationSchema } from "./utils";

// Zod Fields
export const userIdField = zodObjectId().openapi({
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
    example: "very_secret",
});

export const userImageUrlField = z.string().openapi({
    type: "string",
    description: "local url on the storage",
});

export const userIsAdminField = z.boolean().openapi({
    description: "Whether the user is an admin or not",
    example: false,
});

export const userPlacesField = z.array(
    zodObjectId().openapi({
        description: "The id of places belonging to the user, 24 characters",
        example: "683b21134e2e5d46978daf1f",
    })
);

// User Schemas

export const NewUserSchema = z.object({
    name: userNameField,
    email: userEmailField,
    password: userPasswordField,
    imageUrl: userImageUrlField.optional(),
    isAdmin: userIsAdminField,
});

export type NewUser = z.infer<typeof NewUserSchema>;

export const UserSchema = NewUserSchema.extend({
    id: userIdField,
    places: userPlacesField,
});

export type User = z.infer<typeof UserSchema>;

// Put Schemas
export const UserPutSchema = z.object({
    name: userNameField.optional(),
    email: userEmailField.optional(),
    password: userPasswordField.optional(),
});

export type UserPut = z.infer<typeof UserPutSchema>;

// Search Schemas
export const UserSortableFields = [
    "createdAt",
    "name",
    "email",
    "password",
    "imageUrl",
    "isAdmin",
];

export const UserSearchSchema = UserPutSchema.omit({ password: true });

export const UserSearchSwagger = buildPaginationSchema(
    UserSearchSchema,
    UserSortableFields
);

export type UserSearch = z.infer<typeof UserSearchSchema>;

export const UserPaginated = buildPaginatedSchema(UserSchema);
