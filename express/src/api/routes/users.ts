import { z, zodObjectId } from "../../zod";
import { Router, Request, Response, NextFunction } from "express";

import { crudUser, crudPlace } from "../../models/crud";
import {
    UserPut,
    UserPutSchema,
    UserSearchSchema,
    UserSortableFields,
    UserPaginated,
    PlaceSearchSchema,
    PlaceSortableFields,
    UserSearchSwagger,
    UserSchema,
} from "../../models/schemas";
import { validateBody, filter, fetchUser, Admin } from "../middlewares";
import { swaggerRegistery } from "../openapi";

export const userRouter = Router();

// Get Users Endpoint
async function getUsers(req: Request, res: Response, next: NextFunction) {
    const query = req.filterQuery!;
    res.status(200).json(await crudUser.search(query));
}

userRouter.get("/", filter(UserSearchSchema, UserSortableFields), getUsers);

swaggerRegistery.registerPath({
    method: "get",
    path: "/users/",
    request: {
        query: UserSearchSwagger,
    },
    responses: {
        200: {
            description: "Search and Filter users",
            content: {
                "application/json": {
                    schema: UserPaginated,
                },
            },
        },
    },
    tags: ["User"],
    summary: "Search and Retrieve users",
});

// Get User Endpoint
async function getUser(req: Request, res: Response, next: NextFunction) {
    const user = await crudUser.get(req.params.userId);
    res.status(200).json(user);
}

userRouter.get("/:userId", getUser);

swaggerRegistery.registerPath({
    method: "get",
    path: "/users/{userId}",
    request: {
        params: z.object({
            userId: zodObjectId().openapi({
                example: "507f1f77bcf86cd799439011",
                description: "MongoDB ObjectId",
            }),
        }),
    },
    responses: {
        200: {
            description: "User information",
            content: {
                "application/json": {
                    schema: UserSchema,
                },
            },
        },
    },
    tags: ["User"],
    summary: "Search and Retrieve user by id",
});

// Put User Endpoint
async function editUser(req: Request, res: Response, next: NextFunction) {
    const parsed = req.parsed as UserPut;
    const fetchedUser = res.fetchedUser!;
    const updatedUser = await crudUser.updateDocument(fetchedUser, parsed);
    const result = await crudUser.jsonfify(updatedUser);
    res.status(200).json(result);
}

userRouter.put("/:userId", validateBody(UserPutSchema), fetchUser(), editUser);

swaggerRegistery.registerPath({
    method: "put",
    path: "/users/{userId}",
    request: {
        params: z.object({
            userId: zodObjectId().openapi({
                example: "507f1f77bcf86cd799439011",
                description: "MongoDB ObjectId",
            }),
        }),
        body: {
            content: {
                "application/json": {
                    schema: UserPutSchema,
                },
            },
            description: "User updated data",
            required: true,
        },
    },
    responses: {
        200: {
            description: "User information",
            content: {
                "application/json": {
                    schema: UserSchema,
                },
            },
        },
    },
    tags: ["User"],
    summary: "Update users",
    security: [
        {
            BearerAuth: [],
        },
    ],
});

// Delete User Endpoint
async function deleteUser(req: Request, res: Response, next: NextFunction) {
    await crudUser.delete(req.params.userId);
    res.status(200).json({
        message: `Deleted user ${req.params.userId}`,
    });
}

userRouter.delete("/:userId", Admin, deleteUser);

swaggerRegistery.registerPath({
    method: "delete",
    path: "/users/{userId}",
    request: {
        params: z.object({
            userId: zodObjectId().openapi({
                example: "507f1f77bcf86cd799439011",
                description: "MongoDB ObjectId",
            }),
        }),
    },
    responses: {
        200: {
            description: "Deletion confirmation message",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string().openapi({
                            example: "Deleted user 507f1f77bcf86cd799439011",
                        }),
                    }),
                },
            },
        },
    },
    tags: ["User"],
    summary: "Search and Retrieve user by id",
    security: [
        {
            BearerAuth: [],
        },
    ],
});
