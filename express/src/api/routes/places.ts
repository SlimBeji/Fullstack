import { Router, Request, Response, NextFunction } from "express";
import { crudPlace } from "../../models/crud";
import {
    z,
    zodObjectId,
    PlaceSearchSchema,
    PlaceSortableFields,
    PlacePost,
    PlacePostSchema,
    PlacePut,
    PlacePutSchema,
    PlaceSearchSwagger,
    PlacesPaginatedSchema,
    PlaceReadSchema,
} from "../../models/schemas";
import { validateBody, filter, Authenticated } from "../middlewares";
import { swaggerRegistery } from "../openapi";

export const placeRouter = Router();

// Get Places Endpoint
async function getPlaces(req: Request, resp: Response, next: NextFunction) {
    // All places are public
    const query = req.filterQuery!;
    resp.status(200).json(await crudPlace.fetch(query));
}

placeRouter.get("/", filter(PlaceSearchSchema, PlaceSortableFields), getPlaces);

swaggerRegistery.registerPath({
    method: "get",
    path: "/places/",
    request: {
        query: PlaceSearchSwagger,
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
async function createPlace(req: Request, resp: Response, next: NextFunction) {
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
async function getPlace(req: Request, res: Response, next: NextFunction) {
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
async function editPlace(req: Request, res: Response, next: NextFunction) {
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
async function deletePlace(req: Request, res: Response, next: NextFunction) {
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
