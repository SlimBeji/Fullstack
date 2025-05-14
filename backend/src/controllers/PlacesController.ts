import { Response, NextFunction } from "express";

import {
    controller,
    get,
    post,
    put,
    del,
    bodyValidator,
    ParsedRequest,
    use,
} from "../framework";
import { HttpStatus } from "../enums";
import { crudPlace } from "../models";
import {
    PlacePost,
    PlacePostSchema,
    PlacePut,
    PlacePutSchema,
} from "../schemas";
import { extractFile, fileUpload } from "../middlewares/fileupload";
import { storage } from "../utils";
import { ApiError } from "../types";

@controller("/places")
export class PlacesController {
    @get("/")
    public async getPlaces(
        req: ParsedRequest,
        resp: Response,
        next: NextFunction
    ) {
        resp.status(200).json(await crudPlace.search({}));
    }

    @use(fileUpload([{ name: "image" }]))
    @bodyValidator(PlacePostSchema)
    @post("/")
    public async createPlace(
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

    @get("/:placeId")
    public async getPlace(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ) {
        const place = await crudPlace.get(req.params.placeId);
        res.status(200).json(place);
    }

    @bodyValidator(PlacePutSchema)
    @put("/:placeId")
    public async editPlace(
        req: ParsedRequest<PlacePut>,
        res: Response,
        next: NextFunction
    ) {
        const updatedPlace = await crudPlace.update(
            req.params.placeId,
            req.parsed
        );
        res.status(200).json(updatedPlace);
    }

    @del("/:placeId")
    public async deletePlace(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ) {
        await crudPlace.delete(req.params.placeId);
        res.status(200).json({
            message: `Deleted place ${req.params.placeId}`,
        });
    }
}
