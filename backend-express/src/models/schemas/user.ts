import { env } from "@/config";
import { FindQuery } from "@/lib/types";
import {
    filtersSchema,
    httpFilters,
    paginatedSchema,
    zod,
    zodFile,
    ZodInfer,
    zodObjectId,
} from "@/lib/zod_";

// --- Fields ----

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

const image = zodFile("User's profile image (JPEG)", env.FILEUPLOAD_MAX_SIZE);

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

// --- Base Schemas ----
export const UserDBSchema = zod.object({
    id: UserFields.id,
    name: UserFields.name,
    email: UserFields.email,
    isAdmin: UserFields.isAdmin,
    password: UserFields.password,
    imageUrl: UserFields.imageUrl.optional(),
    places: UserFields.places,
});

export type UserDB = ZodInfer<typeof UserDBSchema>;

export type UserSeed = Omit<UserDB, "id" | "places"> & {
    _ref: number;
};

// --- Creation Schemas ----

export const UserCreateSchema = UserDBSchema.omit({ id: true, places: true });

export type UserCreate = ZodInfer<typeof UserCreateSchema>;

export const UserPostSchema = UserCreateSchema.omit({ imageUrl: true }).extend({
    image: UserFields.image.optional(),
});

export type UserPost = ZodInfer<typeof UserPostSchema>;

// ---  Read Schemas ----

export const UserReadSchema = UserDBSchema.omit({ password: true });

export type UserRead = ZodInfer<typeof UserReadSchema>;

export const UsersPaginatedSchema = paginatedSchema(UserReadSchema);

export type UsersPaginated = ZodInfer<typeof UsersPaginatedSchema>;

// ---  Quey Schemas ----

export const UserFiltersSchema = filtersSchema(
    zod.object({
        id: httpFilters(UserFields.id, {
            example: "683b21134e2e5d46978daf1f",
        }).optional(),
        name: httpFilters(UserFields.name, {
            example: "eq:Slim Beji",
        }).optional(),
        email: httpFilters(UserFields.email, {
            example: "eq:mslimbeji@gmail.com",
        }).optional(),
    }),
    userSortableFields,
    userSelectableFields,
    env.MAX_ITEMS_PER_PAGE
);

export type UserFilters = ZodInfer<typeof UserFiltersSchema>;

export type UserFindQuery = FindQuery<
    UserSelectableType,
    UserSortableType,
    UserSearchableType
>;

// --- Update Schemas ---
export const UserUpdateSchema = zod.object({
    name: UserFields.name.optional(),
    email: UserFields.email.optional(),
    password: UserFields.password.optional(),
});

export type UserUpdate = ZodInfer<typeof UserUpdateSchema>;

export const UserPutSchema = UserUpdateSchema.extend({});

export type UserPut = ZodInfer<typeof UserPutSchema>;
