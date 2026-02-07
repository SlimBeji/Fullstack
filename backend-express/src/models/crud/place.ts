import { PlaceWhereInput } from "@/_generated/prisma/models";
import { placeEmbedding } from "@/background/publishers";
import { env } from "@/config";
import { ApiError, HttpStatus } from "@/lib/express_";
import { CrudClass, toPrismaJsonFilter } from "@/lib/prisma_";
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

    async authCreate(user: UserRead, data: PlacePost): Promise<void> {
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Not Authenticated");
        }

        if (user.isAdmin) return;

        if (user.id != data.creatorId) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Access denied", {
                message: `Cannot add places to user ${data.creatorId}`,
            });
        }
    }

    // Read

    async authRead(user: UserRead, data: PlaceRead): Promise<void> {
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Not Authenticated");
        }

        if (user.isAdmin) return;

        if (user.id != data.creatorId) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Access denied", {
                message: `Cannot access user ${data.creatorId} places`,
            });
        }
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

    authSearch(
        user: UserRead,
        where: PlaceWhereInput | undefined
    ): PlaceWhereInput {
        const result = where === undefined ? ({} as PlaceWhereInput) : where;
        result.creatorId = { equals: user.id };
        return result;
    }

    // Update

    async update(id: number, data: PlaceUpdate, process: boolean = false) {
        const verification = await this.model.findFirst({
            where: { id: id },
            select: { title: true, description: true },
        });
        if (!verification) {
            throw this.notFoundError(id);
        }

        const descriptionChanged =
            !!data.description && data.description !== verification.description;
        const titleChanged = !!data.title && data.title !== verification.title;
        const updated = await super.update(id, data, process);
        if (descriptionChanged || titleChanged) {
            placeEmbedding(id);
        }
        return updated;
    }

    async authUpdate(
        user: UserRead,
        id: number,
        data: PlacePut
    ): Promise<void> {
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Not Authenticated");
        }

        if (user.isAdmin) return;

        const count = await this.model.count({
            where: { id: id, creatorId: user.id },
        });
        if (count === 0) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Access denied", {
                message: `Cannot not access place ${id}`,
            });
        }

        if (data.creatorId && data.creatorId != user.id) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Access denied", {
                message: `Cannot set creatorId to ${data.creatorId}`,
            });
        }
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

    async authDelete(user: UserRead, id: number): Promise<void> {
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Not Authenticated");
        }

        if (user.isAdmin) return;

        const count = await this.model.count({
            where: { id: id, creatorId: user.id },
        });
        if (count === 0) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Access denied", {
                message: `Cannot not access place ${id}`,
            });
        }
    }
}

export const crudPlace = new CrudPlace(
    pgClient.client.place,
    "Place",
    PLACE_DEFAULT_SELECT
);
