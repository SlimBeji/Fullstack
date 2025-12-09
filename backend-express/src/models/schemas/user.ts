import { FindQuery } from "@/lib/types";
import { zod, ZodInfer } from "@/lib/zod";

import {
    httpFilters,
    UserFields,
    UserSearchableType,
    userSelectableFields,
    UserSelectableType,
    userSortableFields,
    UserSortableType,
} from "../fields";
import { filtersSchema, paginatedSchema } from "./base";

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
    userSelectableFields
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
