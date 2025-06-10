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
import { storage } from "../../lib/utils";
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

    public safeCheck(
        user: UserRead,
        data: PlaceDocument | PlacePost | PlaceCreate
    ): void {
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
        const imageUrl = await storage.uploadFile(form.image || null);
        const { image, ...body } = form;
        const data = { ...body, imageUrl };
        const doc = await this.createDocument(data);
        return this.jsonfify(doc);
    }

    public async safeCreate(
        user: UserRead,
        form: PlacePost
    ): Promise<PlaceRead> {
        if (!user) {
            throw new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "No authenticated user found"
            );
        }

        if (user.id !== form.creatorId && !user.isAdmin) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                `creatorId must be equal to ${user.id}`
            );
        }
        return await this.create(form);
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
