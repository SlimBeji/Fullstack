import { env } from "@/config";
import { FindQuery } from "@/lib/types";
import {
    filtersSchema,
    getFieldsSectionSchema,
    httpFilters,
    paginatedSchema,
    zod,
    zodFile,
    ZodInfer,
    zodObject,
} from "@/lib/zod_";

import { createdAt, updatedAt } from "./common";

// --- Fields ----

export const userSelectableFields = [
    "id",
    "name",
    "email",
    "isAdmin",
    "imageUrl",
    "places",
    "createdAt",
] as const;

export type UserSelectableType = (typeof userSelectableFields)[number];

export const userSearchableFields = ["id", "name", "email"] as const;

export type UserSearchableType = (typeof userSearchableFields)[number];

export const userSortableFields = [
    "createdAt",
    "-createdAt",
    "name",
    "-name",
    "email",
    "-email",
] as const;

export type UserSortableType = (typeof userSortableFields)[number];

const id = zod.coerce.number().openapi({
    description: "The user ID, 24 characters",
    example: 123456789,
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

const userPlace = zodObject({
    id: zod.coerce
        .number()
        .openapi({ example: 123456789, description: "The user place id" }),
    title: zod.string().min(10).openapi({
        example: "Stamford Bridge",
        description: "The place title/name, 10 characters minimum",
    }),
    address: zod.string().min(1).openapi({
        example: "Fulham road",
        description: "The place address",
    }),
}).openapi({
    description: "The id of places belonging to the user, 24 characters",
    example: "683b21134e2e5d46978daf1f",
});

export type UserPlaceType = ZodInfer<typeof userPlace>;

const places = zod.array(userPlace);

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

export const UserReadSchema = UserDBSchema.omit({ password: true }).extend({
    createdAt,
    updatedAt,
});

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

export const userFieldsSchema = getFieldsSectionSchema(userSelectableFields, [
    "id",
    "places",
]);

// --- Update Schemas ---
export const UserUpdateSchema = zod.object({
    name: UserFields.name.optional(),
    email: UserFields.email.optional(),
    password: UserFields.password.optional(),
});

export type UserUpdate = ZodInfer<typeof UserUpdateSchema>;

export const UserPutSchema = UserUpdateSchema.extend({});

export type UserPut = ZodInfer<typeof UserPutSchema>;
