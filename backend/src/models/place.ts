import { model, Schema } from "mongoose";
import { Crud } from "../framework";
import { CollectionEnum, Place, PlacePost, PlacePut } from "../schemas";

export const PlaceDBSchema = new Schema<Place>({
    // Fields
    title: { type: String, required: true },
    description: { type: String, required: true, min: 10 },
    imageUrl: { type: String, required: false },
    address: { type: String, required: true, min: 1 },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    // Foreign Keys:
    creatorId: {
        type: Schema.ObjectId,
        required: true,
        ref: CollectionEnum.USER,
    },
});

const PlaceDB = model<Place>(CollectionEnum.PLACE, PlaceDBSchema);

type PlaceDocument = InstanceType<typeof PlaceDB>;

export class CrudPlace extends Crud<Place, PlaceDocument, PlacePost, PlacePut> {
    protected secrets = {};

    constructor() {
        super(PlaceDB);
    }
}

export const crudPlace = new CrudPlace();
