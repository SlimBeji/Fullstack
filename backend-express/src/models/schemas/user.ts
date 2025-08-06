import {
    buildPaginatedSchema,
    buildSearchSchema,
    z,
    zodFile,
    zodObjectId,
    zodQueryParam,
} from "./zod";

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
    example: "avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg",
    description: "local url on the storage",
});

export const userImageField = zodFile("User's profile image (JPEG)");

export const userIsAdminField = z.coerce.boolean().openapi({
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
    id: userIdField,
    name: userNameField,
    email: userEmailField,
    password: userPasswordField,
    imageUrl: userImageUrlField.optional(),
    isAdmin: userIsAdminField,
    places: userPlacesField,
});

export type UserDB = z.infer<typeof UserDBSchema>;

export type UserSeed = Omit<UserDB, "id" | "places"> & {
    _ref: number;
};

// Creation Schemas

export const UserCreateSchema = UserDBSchema.omit({ id: true, places: true });

export type UserCreate = z.infer<typeof UserCreateSchema>;

// Post Schemas

export const UserPostSchema = UserCreateSchema.omit({ imageUrl: true }).extend({
    image: userImageField.optional(),
});

export type UserPost = z.infer<typeof UserPostSchema>;

// Read Schemas

export const UserReadSchema = UserDBSchema.omit({ password: true });

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

export const UserFiltersSchema = z.object({
    name: zodQueryParam(userNameField, {
        example: "eq:Slim Beji",
    }).optional(),
    email: zodQueryParam(userEmailField, {
        example: "eq:mslimbeji@gmail.com",
    }).optional(),
});

export type UserFilters = z.infer<typeof UserFiltersSchema>;

export const UserSearchSchema = buildSearchSchema(
    UserFiltersSchema,
    UserSortableFields,
    UserReadSchema
);

export type UserSearch = z.infer<typeof UserSearchSchema>;

export const UserSearchGetSchema = UserSearchSchema.omit({ fields: true });

export type UserSearchGet = z.infer<typeof UserSearchGetSchema>;

// Update Schemas
export const UserUpdateSchema = z.object({
    name: userNameField.optional(),
    email: userEmailField.optional(),
    password: userPasswordField.optional(),
});

export type UserUpdate = z.infer<typeof UserUpdateSchema>;

// Put Schemas
export const UserPutSchema = UserUpdateSchema.extend({});

export type UserPut = z.infer<typeof UserPutSchema>;
