import { Router, Request, Response, NextFunction } from "express";

import { crudPlace } from "../../models/crud";
import {
    PlaceSearchSchema,
    PlaceSortableFields,
    PlacePost,
    PlacePostSchema,
    PlacePut,
    PlacePutSchema,
    PlaceSearchSwagger,
    PlacesPaginatedSchema,
} from "../../models/schemas";
import { validateBody, filter } from "../middlewares";
import { swaggerRegistery } from "../openapi";

export const placeRouter = Router();

// Get Places Endpoint
async function getPlaces(req: Request, resp: Response, next: NextFunction) {
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
    const parsed = req.parsed as PlacePost;
    const newPlace = await crudPlace.create(parsed);
    resp.status(200).json(newPlace);
}

placeRouter.post("/", validateBody(PlacePostSchema), createPlace);

// Get a place by ID
async function getPlace(req: Request, res: Response, next: NextFunction) {
    const place = await crudPlace.getById(req.params.placeId);
    res.status(200).json(place);
}

placeRouter.get("/:placeId", getPlace);

// Edit Places
async function editPlace(req: Request, res: Response, next: NextFunction) {
    const parsed = req.parsed as PlacePut;
    const place = await crudPlace.getDocument(req.params.placeId);
    const updatedPlace = await crudPlace.updateDocument(place!, parsed);
    res.status(200).json(updatedPlace);
}

placeRouter.put("/:placeId", validateBody(PlacePutSchema), editPlace);

// Delete Places
async function deletePlace(req: Request, res: Response, next: NextFunction) {
    await crudPlace.deleteById(req.params.placeId);
    res.status(200).json({
        message: `Deleted place ${req.params.placeId}`,
    });
}

placeRouter.delete("/:placeId", deletePlace);
