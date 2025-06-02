import { Router, Request, Response, NextFunction } from "express";

import { crudPlace } from "../../models/crud";
import {
    PlacePostBody,
    PlacePostSchema,
    PlacePut,
    PlacePutSchema,
} from "../../models/schemas";
import {
    extractFile,
    fileUpload,
    PaginationParams,
    paginate,
    validateBody,
} from "../middlewares";
import { storage } from "../../lib/utils";
import { ApiError, HttpStatus } from "../../types";

export const placeRouter = Router();

async function getPlaces(req: Request, resp: Response, next: NextFunction) {
    const pagination = req.pagination as PaginationParams;
    resp.status(200).json(await crudPlace.search({}, pagination));
}
placeRouter.get("/", paginate(), getPlaces);

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
    const updatedPlace = await crudPlace.update(req.params.placeId, parsed);
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
