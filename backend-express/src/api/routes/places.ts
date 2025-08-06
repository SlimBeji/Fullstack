import { Request, Response, Router } from "express";

import { crudPlace } from "../../models/crud";
import {
    PlacePost,
    PlacePostSchema,
    PlacePut,
    PlacePutSchema,
    PlaceReadSchema,
    PlaceSearchGetSchema,
    PlaceSearchSchema,
    PlacesPaginatedSchema,
    z,
    zodObjectId,
} from "../../models/schemas";
import { Authenticated, filter, validateBody } from "../middlewares";
import { swaggerRegistery } from "../openapi";

export const placeRouter = Router();

// Get Places Endpoint
async function getPlaces(req: Request, resp: Response) {
    // All places are public
    const query = req.filterQuery!;
    resp.status(200).json(await crudPlace.fetch(query));
}

placeRouter.get("/", filter(PlaceSearchGetSchema, "query"), getPlaces);

swaggerRegistery.registerPath({
    method: "get",
    path: "/places/",
    request: {
        query: PlaceSearchGetSchema,
    },
    responses: {
        200: {
            description: "Search and Filter places",
            content: {
                "application/json": {
                    schema: PlacesPaginatedSchema,
                },
            },
        },
    },
    tags: ["Place"],
    summary: "Search and Retrieve places",
});

// Post search
async function queryPlaces(req: Request, resp: Response) {
    // All places are public
    const query = req.filterQuery!;
    resp.status(200).json(await crudPlace.fetch(query));
}

placeRouter.post("/query", filter(PlaceSearchSchema, "body"), queryPlaces);

swaggerRegistery.registerPath({
    method: "post",
    path: "/places/query",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: PlaceSearchSchema,
                },
            },
            description: "Place advanced query",
            required: true,
        },
    },
    responses: {
        200: {
            description: "Search and Filter places",
            content: {
                "application/json": {
                    schema: PlacesPaginatedSchema,
                },
            },
        },
    },
    tags: ["Place"],
    summary: "Search and Retrieve places",
});

// Post New Places
async function createPlace(req: Request, resp: Response) {
    // Use safeCreate to avoid a user posting a place for another user
    const parsed = req.parsed as PlacePost;
    const currentUser = req.currentUser!;
    const newPlace = await crudPlace.safeCreate(currentUser, parsed);
    resp.status(200).json(newPlace);
}

placeRouter.post(
    "/",
    Authenticated,
    validateBody(PlacePostSchema),
    createPlace
);

swaggerRegistery.registerPath({
    method: "post",
    path: "/places/",
    request: {
        body: {
            content: {
                "multipart/form-data": {
                    schema: PlacePostSchema,
                },
            },
            description: "Place creation",
            required: true,
        },
    },
    responses: {
        200: {
            description: "Place creation",
            content: {
                "application/json": {
                    schema: PlaceReadSchema,
                },
            },
        },
    },
    tags: ["Place"],
    summary: "Place Creation",
    security: [
        {
            BearerAuth: [],
        },
    ],
});

// Get a place by ID
async function getPlace(req: Request, res: Response) {
    // All places are public
    const place = await crudPlace.get(req.params.placeId);
    res.status(200).json(place);
}

placeRouter.get("/:placeId", getPlace);

swaggerRegistery.registerPath({
    method: "get",
    path: "/places/{placeId}",
    request: {
        params: z.object({
            placeId: zodObjectId().openapi({
                example: "507f1f77bcf86cd799439011",
                description: "Place Id",
            }),
        }),
    },
    responses: {
        200: {
            description: "Place data",
            content: {
                "application/json": {
                    schema: PlaceReadSchema,
                },
            },
        },
    },
    tags: ["Place"],
    summary: "Search and Retrieve place by id",
});

// Edit Places
async function editPlace(req: Request, res: Response) {
    const parsed = req.parsed as PlacePut;
    const currentUser = req.currentUser!;
    const updatedPlace = await crudPlace.safeUpdateById(
        currentUser,
        req.params.placeId,
        parsed
    );
    res.status(200).json(updatedPlace);
}

placeRouter.put(
    "/:placeId",
    Authenticated,
    validateBody(PlacePutSchema),
    editPlace
);

swaggerRegistery.registerPath({
    method: "put",
    path: "/places/{placeId}",
    request: {
        params: z.object({
            placeId: zodObjectId().openapi({
                example: "507f1f77bcf86cd799439011",
                description: "Place id",
            }),
        }),
        body: {
            content: {
                "application/json": {
                    schema: PlacePutSchema,
                },
            },
            description: "Place updated data",
            required: true,
        },
    },
    responses: {
        200: {
            description: "Place data",
            content: {
                "application/json": {
                    schema: PlaceReadSchema,
                },
            },
        },
    },
    tags: ["Place"],
    summary: "Update places",
    security: [
        {
            BearerAuth: [],
        },
    ],
});

// Delete Places
async function deletePlace(req: Request, res: Response) {
    const currentUser = req.currentUser!;
    await crudPlace.safeDelete(currentUser, req.params.placeId);
    res.status(200).json({
        message: `Deleted place ${req.params.placeId}`,
    });
}

placeRouter.delete("/:placeId", Authenticated, deletePlace);

swaggerRegistery.registerPath({
    method: "delete",
    path: "/places/{placeId}",
    request: {
        params: z.object({
            placeId: zodObjectId().openapi({
                example: "507f1f77bcf86cd799439011",
                description: "Place Id",
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
                            example: "Deleted place 507f1f77bcf86cd799439011",
                        }),
                    }),
                },
            },
        },
    },
    tags: ["Place"],
    summary: "Delete place by id",
    security: [
        {
            BearerAuth: [],
        },
    ],
});
