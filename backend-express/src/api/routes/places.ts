import { Request, Response, Router } from "express";

import { extractFindQuery, validateBody, validateQuery } from "@/lib/express_";
import { zod } from "@/lib/zod_";
import { crudsPlace } from "@/models/cruds";
import {
    PlaceGetSchema,
    PlacePost,
    PlacePostSchema,
    PlacePut,
    PlacePutSchema,
    PlaceReadSchema,
    PlaceSearchQuery,
    PlaceSearchSchema,
    PlacesPaginatedSchema,
} from "@/models/schemas";

import { swaggerRegistery } from "../docs";
import { Authenticated, getCurrentUser } from "../middlewares";

export const placeRouter = Router();

// Get Places Endpoint
async function getPlaces(req: Request, resp: Response) {
    // All places are public
    const query = req.parsedBody as PlaceSearchQuery;
    resp.status(200).json(await crudsPlace.paginate(query));
}

placeRouter.get(
    "/",
    Authenticated,
    extractFindQuery(PlaceSearchSchema, "query"),
    getPlaces
);

swaggerRegistery.registerPath({
    method: "get",
    path: "/places/",
    request: {
        query: PlaceSearchSchema,
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
    security: [{ OAuth2Password: [] }],
});

// Post search
async function searchPlaces(req: Request, resp: Response) {
    // All places are public
    const query = req.parsedBody as PlaceSearchQuery;
    resp.status(200).json(await crudsPlace.paginate(query));
}

placeRouter.post(
    "/search",
    Authenticated,
    extractFindQuery(PlaceSearchSchema, "body"),
    searchPlaces
);

swaggerRegistery.registerPath({
    method: "post",
    path: "/places/search",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: PlaceSearchSchema,
                },
            },
            description: "Place advanced search",
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
    security: [{ OAuth2Password: [] }],
});

// Post New Places
async function createPlace(req: Request, resp: Response) {
    // Use safeCreate to avoid a user posting a place for another user
    const parsed = req.parsedBody as PlacePost;
    const currentUser = getCurrentUser(req);
    const newPlace = await crudsPlace.userPost(currentUser, parsed, {
        process: true,
    });
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
    security: [{ OAuth2Password: [] }],
});

// Get a place by ID
async function getPlace(req: Request, res: Response) {
    // All places are public
    const place = await crudsPlace.get(req.params.placeId, {
        fields: req.parsedQuery.fields,
        process: true,
    });
    res.status(200).json(place);
}

placeRouter.get(
    "/:placeId",
    Authenticated,
    validateQuery(PlaceGetSchema),
    getPlace
);

swaggerRegistery.registerPath({
    method: "get",
    path: "/places/{placeId}",
    request: {
        params: zod.object({
            placeId: zod.number().openapi({
                example: 123456789,
                description: "Place Id",
            }),
        }),
        query: PlaceGetSchema,
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
    security: [{ OAuth2Password: [] }],
});

// Edit Places
async function editPlace(req: Request, res: Response) {
    const parsed = req.parsedBody as PlacePut;
    const currentUser = getCurrentUser(req);
    const updatedPlace = await crudsPlace.userPut(
        currentUser,
        req.params.placeId,
        parsed,
        { process: true }
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
        params: zod.object({
            placeId: zod.number().openapi({
                example: 123456789,
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
    security: [{ OAuth2Password: [] }],
});

// Delete Places
async function deletePlace(req: Request, res: Response) {
    const currentUser = getCurrentUser(req);
    await crudsPlace.userDelete(currentUser, req.params.placeId);
    res.status(200).json({
        message: `Deleted place ${req.params.placeId}`,
    });
}

placeRouter.delete("/:placeId", Authenticated, deletePlace);

swaggerRegistery.registerPath({
    method: "delete",
    path: "/places/{placeId}",
    request: {
        params: zod.object({
            placeId: zod.number().openapi({
                example: 123456789,
                description: "Place Id",
            }),
        }),
    },
    responses: {
        200: {
            description: "Deletion confirmation message",
            content: {
                "application/json": {
                    schema: zod.object({
                        message: zod.string().openapi({
                            example: "Deleted place 507f1f77bcf86cd799439011",
                        }),
                    }),
                },
            },
        },
    },
    tags: ["Place"],
    summary: "Delete place by id",
    security: [{ OAuth2Password: [] }],
});
