import { model } from "mongoose";
import { Crud } from "../framework";
import {
    CollectionEnum,
    Place,
    PlaceDBSchema,
    PlacePost,
    PlacePut,
} from "../schemas";

const PlaceDB = model<Place>(CollectionEnum.PLACE, PlaceDBSchema);

type PlaceDocument = InstanceType<typeof PlaceDB>;

export class CrudPlace extends Crud<Place, PlaceDocument, PlacePost, PlacePut> {
    protected secrets = {};

    constructor() {
        super(PlaceDB);
    }
}

export const crudPlace = new CrudPlace();
