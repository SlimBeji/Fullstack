import { model } from "mongoose";
import { Crud } from "../framework";
import { Place, PlaceDBSchema, PlacePost, PlacePut } from "../schemas";

const PlaceDB = model<Place>("Place", PlaceDBSchema);

type PlaceDocument = InstanceType<typeof PlaceDB>;

export class CrudPlace extends Crud<Place, PlaceDocument, PlacePost, PlacePut> {
    protected secrets = {};

    constructor() {
        super(PlaceDB);
    }
}

export const crudPlace = new CrudPlace();
