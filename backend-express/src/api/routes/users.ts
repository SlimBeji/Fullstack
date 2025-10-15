import { Request, Response, Router } from "express";

import { crudUser } from "../../models/crud";
import { zodObjectId } from "../../models/fields";
import {
    UserFiltersSchema,
    UserPost,
    UserPostSchema,
    UserPut,
    UserPutSchema,
    UserReadSchema,
    UsersPaginatedSchema,
} from "../../models/schemas";
import z from "../../zodExt";
import { swaggerRegistery } from "../docs";
import { Admin, Authenticated, filter, validateBody } from "../middlewares";

export const userRouter = Router();

// Get Users Endpoint
async function getUsers(req: Request, res: Response) {
    // All users are public
    const query = req.filterQuery!;
    res.status(200).json(await crudUser.fetch(query));
}

userRouter.get(
    "/",
    Authenticated,
    filter(UserFiltersSchema, "query"),
    getUsers
);

swaggerRegistery.registerPath({
    method: "get",
    path: "/users/",
    request: {
        query: UserFiltersSchema,
    },
    responses: {
        200: {
            description: "Search and Filter users",
            content: {
                "application/json": {
                    schema: UsersPaginatedSchema,
                },
            },
        },
    },
    tags: ["User"],
    summary: "Search and Retrieve users",
    security: [{ OAuth2Password: [] }],
});

// Post Search

async function queryUsers(req: Request, res: Response) {
    // All users are public
    const query = req.filterQuery!;
    res.status(200).json(await crudUser.fetch(query));
}

userRouter.post("/query", filter(UserFiltersSchema, "body"), queryUsers);

swaggerRegistery.registerPath({
    method: "post",
    path: "/users/query",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: UserFiltersSchema,
                },
            },
            description: "user advanced Search",
            required: true,
        },
    },
    responses: {
        200: {
            description: "Search and Filter users",
            content: {
                "application/json": {
                    schema: UsersPaginatedSchema,
                },
            },
        },
    },
    tags: ["User"],
    summary: "Search and Retrieve users",
    security: [{ OAuth2Password: [] }],
});

// Post a User (admin only)
async function createUser(req: Request, res: Response) {
    const currentUser = req.currentUser!;
    const parsed = req.parsed as UserPost;
    const newUser = await crudUser.userCreate(currentUser, parsed);
    res.status(200).json(newUser);
}

userRouter.post("/", Admin, validateBody(UserPostSchema), createUser);

swaggerRegistery.registerPath({
    method: "post",
    path: "/users/",
    request: {
        body: {
            content: {
                "multipart/form-data": {
                    schema: UserPostSchema,
                },
            },
            description: "user creation form for admin",
            required: true,
        },
    },
    responses: {
        200: {
            description: "User creation for admin",
            content: {
                "application/json": {
                    schema: UserReadSchema,
                },
            },
        },
    },
    tags: ["User"],
    summary: "User Creation",
    security: [{ OAuth2Password: [] }],
});

// Get User Endpoint
async function getUser(req: Request, res: Response) {
    // All users are public
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
                    schema: UserReadSchema,
                },
            },
        },
    },
    tags: ["User"],
    summary: "Search and Retrieve user by id",
    security: [{ OAuth2Password: [] }],
});

// Put User Endpoint
async function editUser(req: Request, res: Response) {
    const parsed = req.parsed as UserPut;
    const currentUser = req.currentUser!;
    const updatedUser = await crudUser.userUpdateById(
        currentUser,
        req.params.userId,
        parsed
    );
    res.status(200).json(updatedUser);
}

userRouter.put(
    "/:userId",
    validateBody(UserPutSchema),
    Authenticated,
    editUser
);

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
                    schema: UserReadSchema,
                },
            },
        },
    },
    tags: ["User"],
    summary: "Update users",
    security: [{ OAuth2Password: [] }],
});

// Delete User Endpoint
async function deleteUser(req: Request, res: Response) {
    const currentUser = req.currentUser!;
    await crudUser.userDelete(currentUser, req.params.userId);
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
    summary: "Delete user by id",
    security: [{ OAuth2Password: [] }],
});
