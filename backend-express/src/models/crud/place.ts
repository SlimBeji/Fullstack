import { placeEmbedding } from "@/background/publishers";
import { ApiError, HttpStatus } from "@/lib/express";
import { Filter } from "@/lib/types";
import { storage } from "@/services/instances";

import { PlaceDocument, PlaceModel } from "../collections";
import {
    PlaceSearchableType,
    PlaceSelectableType,
    PlaceSortableType,
} from "../fields";
import {
    PlaceCreate,
    PlaceDB,
    PlaceFilters,
    PlaceFindQuery,
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
    PlaceSortableType,
    PlaceSelectableType,
    PlaceSearchableType,
    PlaceFilters,
    PlaceCreate,
    PlacePost,
    PlaceUpdate,
    PlacePut
> {
    constructor() {
        super(PlaceModel);
    }

    protected filterFieldsMapping: Record<string, string> = {
        locationLat: "location.lat",
        locationLng: "location.lng",
    };

    public authCheck(
        user: UserRead,
        data: PlaceDocument | PlacePost | PlacePut,
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

    public addOwnershipFilters(
        user: UserRead,
        query: PlaceFindQuery
    ): PlaceFindQuery {
        const ownershipFilters: Filter[] = [{ op: "eq", val: user.id }];
        if (!query.filters) {
            query.filters = {};
        }

        const creatorFilters: Filter[] = query.filters.creatorId || [];
        creatorFilters.push(...ownershipFilters);
        query.filters.creatorId = creatorFilters;
        return query;
    }

    public async post_process(
        doc: PlaceDocument
    ): Promise<PlaceRead | Partial<PlaceRead>> {
        const obj = this.serializeDocument(doc);
        delete obj.embedding;
        if (obj.imageUrl) {
            obj.imageUrl = await storage.getSignedUrl(obj.imageUrl);
        }
        return obj;
    }

    public async create(form: PlacePost): Promise<PlaceRead> {
        const imageUrl = await storage.uploadFile(form.image || null);
        const { image: _image, lat, lng, ...body } = form;
        const data = { ...body, imageUrl, location: { lat, lng } };
        const doc = await this.createDocument(data);
        placeEmbedding(doc.id);
        const result = await this.post_process(doc);
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
        const result = await this.post_process(doc);
        return result as PlaceRead;
    }

    public async deleteCleanup(document: PlaceDocument): Promise<void> {
        if (document.imageUrl) {
            storage.deleteFile(document.imageUrl);
        }
    }
}

export const crudPlace = new CrudPlace();
