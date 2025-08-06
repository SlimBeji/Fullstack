import { storage } from "../../lib/clients";
import { ApiError, HttpStatus, MongoFindQuery } from "../../types";
import { placeEmbedding } from "../../worker/tasks";
import { PlaceDocument, PlaceModel } from "../collections";
import {
    PlaceCreate,
    PlaceDB,
    PlacePost,
    PlacePut,
    PlaceRead,
    PlaceUpdate,
    UserRead,
} from "../schemas";
import { Crud, CrudEvent } from "./base";

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
        data: PlaceDocument | PlacePost | PlaceCreate,
        _event: CrudEvent
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

    public safeFilter(
        user: UserRead,
        filterQuery: MongoFindQuery<PlaceDB>
    ): MongoFindQuery<PlaceDB> {
        const { sort, filters, pagination } = filterQuery;
        if (filters) {
            filters.creatorId = { $eq: user.id };
        }
        return { sort, filters, pagination };
    }

    public async jsonifyBatch(
        docs: PlaceDocument[]
    ): Promise<PlaceRead[] | Partial<PlaceRead>[]> {
        const placesPromises = docs.map(async (doc) => {
            const obj = this.serializeDocument(doc);
            delete obj.embedding;
            if (obj.imageUrl) {
                obj.imageUrl = await storage.getSignedUrl(obj.imageUrl);
            }
            return obj;
        });
        return Promise.all(placesPromises);
    }

    public async create(form: PlacePost): Promise<PlaceRead> {
        const imageUrl = await storage.uploadFile(form.image || null);
        const { image: _image, ...body } = form;
        const data = { ...body, imageUrl };
        const doc = await this.createDocument(data);
        placeEmbedding(doc.id);
        const result = await this.jsonfify(doc);
        return result as PlaceRead;
    }

    public async update(
        obj: PlaceDocument,
        form: PlacePut
    ): Promise<PlaceRead> {
        const descriptionChanged =
            !!form.description && form.description !== obj.description;
        const titleChanged = !!form.title && form.title !== obj.title;
        const doc = await this.updateDocument(obj, form);
        if (descriptionChanged || titleChanged) {
            placeEmbedding(doc.id);
        }
        const result = await this.jsonfify(doc);
        return result as PlaceRead;
    }

    public async deleteCleanup(document: PlaceDocument): Promise<void> {
        if (document.imageUrl) {
            storage.deleteFile(document.imageUrl);
        }
    }
}

export const crudPlace = new CrudPlace();
