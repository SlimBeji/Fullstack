import { FileToUpload } from "../../types";
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

export const userImageField = z.string().openapi({
    type: "string",
    format: "binary",
    description: "User's profile image (JPEG)",
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

// DB Schemas
export const UserDBSchema = z.object({
    name: userNameField,
    email: userEmailField,
    password: userPasswordField,
    imageUrl: userImageUrlField.optional(),
    isAdmin: userIsAdminField,
    places: userPlacesField,
});

export type UserDB = z.infer<typeof UserDBSchema>;

// Seed Schemas

export const UserSeedSchema = UserDBSchema.extend({});

export type UserSeed = z.infer<typeof UserSeedSchema>;

// Creation Schemas

export const UserCreateSchema = UserDBSchema.extend({});

export type UserCreate = z.infer<typeof UserCreateSchema>;

// Post Schemas

export const UserPostSchema = UserCreateSchema.omit({ imageUrl: true }).extend({
    image: userImageField,
});

export type UserPost = Omit<z.infer<typeof UserPostSchema>, "image"> & {
    image: FileToUpload;
};

// Read Schemas

export const UserReadSchema = UserDBSchema.extend({
    id: userIdField,
}).omit({ password: true });

export type UserRead = z.infer<typeof UserReadSchema>;

export const UsersPaginatedSchema = buildPaginatedSchema(UserReadSchema);

export type UsersPaginated = z.infer<typeof UsersPaginatedSchema>;

// Quey Schemas
export const UserSortableFields = [
    "createdAt",
    "name",
    "email",
    "password",
    "imageUrl",
    "isAdmin",
];

export const UserSearchSchema = z.object({
    name: userNameField.optional(),
    email: userEmailField.optional(),
});

export type UserSearch = z.infer<typeof UserSearchSchema>;

export const UserSearchSwagger = buildPaginationSchema(
    UserSearchSchema,
    UserSortableFields
);

// Update Schemas
export const UserUpdateSchema = UserSearchSchema.extend({
    password: userPasswordField.optional(),
});

export type UserUpdate = z.infer<typeof UserUpdateSchema>;

// Put Schemas
export const UserPutSchema = UserUpdateSchema.extend({});

export type UserPut = z.infer<typeof UserPutSchema>;
