import {
    PlaceDB,
    PlaceCreate,
    PlacePut,
    PlaceRead,
    PlacePost,
    PlaceUpdate,
    UserRead,
} from "../schemas";
import { PlaceModel, PlaceDocument } from "../collections";
import { storage } from "../../lib/clients";
import { Crud } from "./base";
import { ApiError, HttpStatus, FilterQuery } from "../../types";

export class CrudPlace extends Crud<
    PlaceDB,
    PlaceDocument,
    PlaceRead,
    PlaceCreate,
    PlacePost,
    PlaceUpdate,
    PlacePut
> {
    constructor() {
        super(PlaceModel);
    }

    protected defaultProjection = { __v: 0 } as const;

    public safeCheck(
        user: UserRead,
        data: PlaceDocument | PlacePost | PlaceCreate
    ): void {
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Not Authenticated");
        }
        if (user.isAdmin) return;
        const creatorId = "creatorId" in data ? data.creatorId : undefined;
        if (creatorId && creatorId !== user.id) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                `Cannot set creatorId to ${creatorId}. Access denied`
            );
        }
    }

    public safeFilter(user: UserRead, filterQuery: FilterQuery): FilterQuery {
        const { sort, filters, pagination } = filterQuery;
        if (filters) {
            filters.creatorId = { $eq: user.id };
        }
        return { sort, filters, pagination };
    }

    public async jsonifyBatch(docs: PlaceDocument[]): Promise<PlaceRead[]> {
        const placesPromises = docs.map(async (doc) => {
            let obj = this.serializeDocument(doc);
            if (obj.imageUrl) {
                obj.imageUrl = await storage.getSignedUrl(obj.imageUrl);
            }
            return obj;
        });
        return await Promise.all(placesPromises);
    }

    public async create(form: PlacePost): Promise<PlaceRead> {
        const imageUrl = await storage.uploadFile(form.image || null);
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
