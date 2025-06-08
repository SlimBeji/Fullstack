import {
    PlaceDB,
    PlaceCreate,
    PlacePut,
    PlaceRead,
    PlacePost,
    PlaceUpdate,
} from "../schemas";
import { PlaceModel, PlaceDocument } from "../collections";
import { storage } from "../../lib/utils";
import { Crud } from "./base";

export class CrudPlace extends Crud<
    PlaceDB,
    PlaceDocument,
    PlaceRead,
    PlaceCreate,
    PlacePost,
    PlaceUpdate,
    PlacePut
> {
    protected secrets = {};

    constructor() {
        super(PlaceModel);
    }

    public async jsonifyBatch(docs: PlaceDocument[]): Promise<PlaceRead[]> {
        const placesPromises = docs.map(async (doc) => {
            const obj = this.serializeDocument(doc);
            let imageUrl = "";
            if (obj.imageUrl) {
                imageUrl = await storage.getSignedUrl(obj.imageUrl);
            }
            return { ...obj, imageUrl } as PlaceRead;
        });
        return await Promise.all(placesPromises);
    }

    public async create(form: PlacePost): Promise<PlaceRead> {
        const imageUrl = await storage.uploadFile(form.image);
        const { image, ...body } = form;
        const data = { ...body, imageUrl };
        const doc = await this.createDocument(data);
        return this.jsonfify(doc);
    }

    public async update(
        obj: PlaceDocument,
        form: PlacePut
    ): Promise<PlaceRead> {
        const doc = await this.updateDocument(obj, form);
        return await this.jsonfify(doc);
    }

    public async deleteCleanup(document: PlaceDocument): Promise<void> {
        if (document.imageUrl) {
            storage.deleteFile(document.imageUrl);
        }
    }
}

export const crudPlace = new CrudPlace();
