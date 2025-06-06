import { Router, Request, Response, NextFunction } from "express";

import { crudPlace } from "../../models/crud";
import {
    PlacePostBody,
    PlacePostSchema,
    PlacePut,
    PlacePutSchema,
    PlaceSearchSchema,
    PlaceSortableFields,
} from "../../models/schemas";
import { extractFile, fileUpload, validateBody, filter } from "../middlewares";
import { storage } from "../../lib/utils";
import { ApiError, HttpStatus } from "../../types";

export const placeRouter = Router();

async function getPlaces(req: Request, resp: Response, next: NextFunction) {
    const query = req.filterQuery!;
    resp.status(200).json(await crudPlace.search(query));
}
placeRouter.get("/", filter(PlaceSearchSchema, PlaceSortableFields), getPlaces);

async function createPlace(req: Request, resp: Response, next: NextFunction) {
    const parsed = req.parsed as PlacePostBody;
    const imageFile = extractFile(req, "image");
    if (!imageFile) {
        throw new ApiError(HttpStatus.BAD_REQUEST, "No Image was provided");
    }
    const imageUrl = await storage.uploadFile(imageFile);
    const newPlace = await crudPlace.create({ ...parsed, imageUrl });
    resp.status(200).json(newPlace);
}
placeRouter.post(
    "/",
    fileUpload([{ name: "image" }]),
    validateBody(PlacePostSchema),
    createPlace
);

async function getPlace(req: Request, res: Response, next: NextFunction) {
    const place = await crudPlace.get(req.params.placeId);
    res.status(200).json(place);
}
placeRouter.get("/:placeId", getPlace);

async function editPlace(req: Request, res: Response, next: NextFunction) {
    const parsed = req.parsed as PlacePut;
    const place = await crudPlace.get(req.params.placeId);
    const updatedPlace = await crudPlace.update(place.id, parsed);
    res.status(200).json(updatedPlace);
}
placeRouter.put("/:placeId", validateBody(PlacePutSchema), editPlace);

async function deletePlace(req: Request, res: Response, next: NextFunction) {
    await crudPlace.delete(req.params.placeId);
    res.status(200).json({
        message: `Deleted place ${req.params.placeId}`,
    });
}
placeRouter.delete("/:placeId", deletePlace);
