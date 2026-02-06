import { PlaceWhereInput } from "@/_generated/prisma/models";
import { placeEmbedding } from "@/background/publishers";
import { env } from "@/config";
import { ApiError, HttpStatus } from "@/lib/express_";
import { CrudClass, CrudEvent, toPrismaJsonFilter } from "@/lib/prisma_";
import { FieldFilter, FindQueryFilters } from "@/lib/types";
import { pgClient, storage } from "@/services/instances";

import {
    PlaceModel,
    PlaceOrderBy,
    PlaceSelect,
    PlaceWhere,
    PlaceWhereUnique,
} from "../orm";
import {
    PLACE_DEFAULT_SELECT,
    PlaceCreate,
    PlacePost,
    PlacePut,
    PlaceRead,
    PlaceSearchableType,
    PlaceSelectableType,
    PlaceSortableType,
    PlaceUpdate,
    UserRead,
} from "../schemas";

type PlaceDelegate = typeof pgClient.client.place;

export class CrudPlace extends CrudClass<
    PlaceDelegate,
    PlaceModel,
    UserRead,
    PlaceCreate,
    PlacePost,
    PlaceRead,
    PlaceSelectableType,
    PlaceSelect,
    PlaceSortableType,
    PlaceOrderBy,
    PlaceSearchableType,
    PlaceWhere,
    PlaceWhereUnique,
    PlaceUpdate,
    PlacePut
> {
    MAX_ITEMS_PER_PAGE = env.MAX_ITEMS_PER_PAGE;

    // Authorization

    authCheck(
        user: UserRead,
        data: PlaceModel | UserRead | PlacePost | PlacePut,
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

    addOwnershipFilters(
        user: UserRead,
        where: PlaceWhereInput | undefined
    ): PlaceWhereInput {
        const result = where === undefined ? ({} as PlaceWhereInput) : where;
        result.creatorId = { equals: user.id };
        return result;
    }

    // Serialization

    async postProcess<
        T extends
            | Partial<PlaceRead>
            | PlaceRead
            | Partial<PlaceModel>
            | PlaceModel,
    >(raw: T): Promise<T> {
        if (raw.imageUrl) {
            raw.imageUrl = await storage.getSignedUrl(raw.imageUrl);
        }
        return raw;
    }

    // Create

    async create(data: PlaceCreate, process: boolean = false) {
        const result = await super.create(data, process);
        placeEmbedding(result.id);
        return result;
    }

    async handlePostForm(form: PlacePost): Promise<PlaceCreate> {
        const imageUrl = await storage.uploadFile(form.image || null);
        const { image: _image, lat, lng, ...body } = form;
        return { ...body, imageUrl, location: { lat, lng } };
    }

    // Search

    toWhere(filters: FindQueryFilters<PlaceSearchableType>): PlaceWhere {
        const where = super.toWhere(filters);
        const andClause = [];
        if ("locationLat" in filters) {
            const latFilter = toPrismaJsonFilter(
                filters["locationLat"] as FieldFilter,
                ["lat"]
            );
            andClause.push(latFilter);
        }
        if ("locationLng" in filters) {
            const lngFilter = toPrismaJsonFilter(
                filters["locationLng"] as FieldFilter,
                ["lng"]
            );
            andClause.push(lngFilter);
        }
        where["location"] = { AND: andClause } as any;
        return where;
    }

    // Update

    async update(
        idOrObj: number | PlaceRead | PlaceModel,
        data: PlaceUpdate,
        process: boolean = false
    ) {
        let obj: Partial<PlaceModel>;
        if (typeof idOrObj === "number") {
            const result = await this.model.findFirst({
                where: { id: idOrObj },
                select: { id: true, title: true, description: true },
            });
            if (!result) {
                throw this.notFoundError(idOrObj);
            }
            obj = result;
        } else {
            obj = idOrObj;
        }

        const descriptionChanged =
            !!data.description && data.description !== obj.description;
        const titleChanged = !!data.title && data.title !== obj.title;
        const updated = await super.update(obj.id as number, data, process);
        if (descriptionChanged || titleChanged) {
            placeEmbedding(obj.id as number);
        }
        return updated;
    }

    // Delete

    async delete(id: number): Promise<void> {
        const object = await this.get(id);
        if (!object) {
            throw this.notFoundError(id);
        }
        await super.delete(id);
        if (object.imageUrl) {
            storage.deleteFile(object.imageUrl);
        }
    }
}

export const crudPlace = new CrudPlace(
    pgClient.client.place,
    "Place",
    PLACE_DEFAULT_SELECT
);
