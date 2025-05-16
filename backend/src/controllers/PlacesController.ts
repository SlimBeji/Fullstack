import { Router, Response, NextFunction, RequestHandler } from "express";

import { crudPlace } from "../models";
import {
    PlacePost,
    PlacePostSchema,
    PlacePut,
    PlacePutSchema,
} from "../schemas";
import { extractFile, fileUpload, validateBody } from "../middlewares";
import { storage } from "../utils";
import { ApiError, HttpStatus } from "../types";

export const placeRouter = Router();

async function getPlaces(
    req: ParsedRequest,
    resp: Response,
    next: NextFunction
) {
    resp.status(200).json(await crudPlace.search({}));
}
placeRouter.get("/", getPlaces as RequestHandler);

async function createPlace(
    req: ParsedRequest<PlacePost>,
    resp: Response,
    next: NextFunction
) {
    const imageFile = extractFile(req, "image");
    if (!imageFile) {
        throw new ApiError(HttpStatus.BAD_REQUEST, "No Image was provided");
    }

    req.parsed.imageUrl = await storage.uploadFile(imageFile);
    const newPlace = await crudPlace.create(req.parsed);
    resp.status(200).json(newPlace);
}
placeRouter.post(
    "/",
    fileUpload([{ name: "image" }]),
    validateBody(PlacePostSchema) as RequestHandler,
    createPlace as RequestHandler
);

async function getPlace(req: ParsedRequest, res: Response, next: NextFunction) {
    const place = await crudPlace.get(req.params.placeId);
    res.status(200).json(place);
}
placeRouter.get("/:placeId", getPlace as RequestHandler);

async function editPlace(
    req: ParsedRequest<PlacePut>,
    res: Response,
    next: NextFunction
) {
    const updatedPlace = await crudPlace.update(req.params.placeId, req.parsed);
    res.status(200).json(updatedPlace);
}
placeRouter.put(
    "/:placeId",
    validateBody(PlacePutSchema) as RequestHandler,
    editPlace as RequestHandler
);

async function deletePlace(
    req: ParsedRequest,
    res: Response,
    next: NextFunction
) {
    await crudPlace.delete(req.params.placeId);
    res.status(200).json({
        message: `Deleted place ${req.params.placeId}`,
    });
}
placeRouter.delete("/:placeId", deletePlace as RequestHandler);
