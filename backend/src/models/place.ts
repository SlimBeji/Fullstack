import { model, Schema } from "mongoose";
import { Place, PlacePost, PlacePut } from "../schemas";
import { CollectionEnum } from "../types";
import { UserDB } from "./user";
import { storage } from "../utils";
import { Crud } from "./base";

// Schema creation
export const PlaceDBSchema = new Schema<Place>({
    // Fields
    title: { type: String, required: true },
    description: { type: String, required: true, min: 10 },
    imageUrl: { type: String, required: false },
    address: { type: String, required: true, min: 1 },
    location: {
        required: false,
        type: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
    },
    // Foreign Keys:
    creatorId: {
        type: Schema.ObjectId,
        required: true,
        ref: CollectionEnum.USER,
    },
});

// Hooks
PlaceDBSchema.pre("save", async function (next) {
    const userExists = await UserDB.exists({ _id: this.creatorId });
    if (!userExists) throw new Error("User does not exist");
    next();
});

PlaceDBSchema.post("save", async function (place, next) {
    await UserDB.findByIdAndUpdate(place.creatorId, {
        $push: { places: place._id },
    });
    next();
});

PlaceDBSchema.pre("deleteOne", async function (next) {
    const place = await this.model.findOne(this.getFilter());
    await UserDB.findByIdAndUpdate(place.creatorId, {
        $pull: { places: place._id },
    });
    next();
});

// Model Creation
export const PlaceDB = model<Place>(CollectionEnum.PLACE, PlaceDBSchema);

type PlaceDocument = InstanceType<typeof PlaceDB>;

// Crud Class
export class CrudPlace extends Crud<Place, PlaceDocument, PlacePost, PlacePut> {
    protected secrets = {};

    constructor() {
        super(PlaceDB);
    }

    public async toJson(raws: PlaceDocument[]): Promise<Place[]> {
        const places = await super.toJson(raws);
        const placesPromises = places.map(async (p) => {
            const imageUrl = await storage.getSignedUrl(p.imageUrl!);
            return { ...p, imageUrl };
        });
        return await Promise.all(placesPromises);
    }

    public async deleteCleanup(document: PlaceDocument): Promise<void> {
        if (document.imageUrl) {
            storage.deleteFile(document.imageUrl);
        }
    }
}

export const crudPlace = new CrudPlace();
