import { Place, PlacePost, PlacePut } from "../schemas";
import { PlaceDB, PlaceDocument } from "../collections";
import { storage } from "../../lib/utils";
import { Crud } from "./base";

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
