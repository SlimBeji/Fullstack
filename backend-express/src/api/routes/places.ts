import { Request, Response, Router } from "express";

import { extractFindQuery, validateBody } from "@/lib/express_";
import { zod } from "@/lib/zod_";
import { crudsPlace } from "@/models/cruds";
import {
    PlaceFiltersSchema,
    PlaceFindQuery,
    PlacePost,
    PlacePostSchema,
    PlacePut,
    PlacePutSchema,
    PlaceReadSchema,
    PlacesPaginatedSchema,
} from "@/models/schemas";

import { swaggerRegistery } from "../docs";
import { Authenticated, getCurrentUser } from "../middlewares";

export const placeRouter = Router();

// Get Places Endpoint
async function getPlaces(req: Request, resp: Response) {
    // All places are public
    const query = req.parsed as PlaceFindQuery;
    resp.status(200).json(await crudsPlace.paginate(query));
}

placeRouter.get("/", extractFindQuery(PlaceFiltersSchema, "query"), getPlaces);

swaggerRegistery.registerPath({
    method: "get",
    path: "/places/",
    request: {
        query: PlaceFiltersSchema,
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
async function queryPlaces(req: Request, resp: Response) {
    // All places are public
    const query = req.parsed as PlaceFindQuery;
    resp.status(200).json(await crudsPlace.paginate(query));
}

placeRouter.post(
    "/query",
    extractFindQuery(PlaceFiltersSchema, "body"),
    queryPlaces
);

swaggerRegistery.registerPath({
    method: "post",
    path: "/places/query",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: PlaceFiltersSchema,
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
    security: [{ OAuth2Password: [] }],
});

// Post New Places
async function createPlace(req: Request, resp: Response) {
    // Use safeCreate to avoid a user posting a place for another user
    const parsed = req.parsed as PlacePost;
    const currentUser = getCurrentUser(req);
    const newPlace = await crudsPlace.userPost(currentUser, parsed, true);
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
    const place = await crudsPlace.get(req.params.placeId, true);
    res.status(200).json(place);
}

placeRouter.get("/:placeId", getPlace);

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
    const parsed = req.parsed as PlacePut;
    const currentUser = getCurrentUser(req);
    const updatedPlace = await crudsPlace.userPut(
        currentUser,
        req.params.placeId,
        parsed,
        true
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
