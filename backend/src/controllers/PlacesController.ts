import { Response, NextFunction } from "express";

import {
    controller,
    get,
    post,
    put,
    del,
    bodyValidator,
    ParsedRequest,
} from "../framework";
import { crudPlace } from "../models";
import {
    PlacePost,
    PlacePostSchema,
    PlacePut,
    PlacePutSchema,
} from "../schemas";

@controller("/places")
export class PlacesController {
    @get("/")
    public getPlaces(
        req: ParsedRequest,
        resp: Response,
        next: NextFunction
    ): void {
        resp.status(200).json(crudPlace.placeLookup("*"));
    }

    @bodyValidator(PlacePostSchema)
    @post("/")
    public createPlace(
        req: ParsedRequest<PlacePost>,
        resp: Response,
        next: NextFunction
    ): void {
        const newPlace = crudPlace.createPlace(req.parsed);
        resp.status(200).json(newPlace);
    }

    @get("/:placeId")
    public getPlace(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ): void {
        const place = crudPlace.placeLookup(req.params.placeId)[0];
        res.status(200).json(place);
    }

    @bodyValidator(PlacePutSchema)
    @put("/:placeId")
    public editPlace(
        req: ParsedRequest<PlacePut>,
        res: Response,
        next: NextFunction
    ): void {
        const updatedPlace = crudPlace.updatePlace(
            req.params.placeId,
            req.parsed
        );
        res.status(200).json(updatedPlace);
    }

    @del("/:placeId")
    public deletePlace(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ): void {
        crudPlace.deletePlace(req.params.placeId);
        res.status(200).json({
            message: `Deleted place ${req.params.placeId}`,
        });
    }
}
