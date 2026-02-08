import { placeEmbedding } from "@/background/publishers";
import { env } from "@/config";
import { ApiError, HttpStatus } from "@/lib/express_";
import { CrudClass, PrismaFindQuery, toPrismaJsonFilter } from "@/lib/prisma_";
import { FieldFilter, FindQueryFilters, PaginatedData } from "@/lib/types";
import { huggingFace, pgClient, storage } from "@/services/instances";

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

    // Post-Processing

    async postProcess<T extends Partial<PlaceRead> | PlaceRead>(
        raw: T
    ): Promise<T> {
        if (raw.imageUrl) {
            raw.imageUrl = await storage.getSignedUrl(raw.imageUrl);
        }
        return raw;
    }

    // Create

    async seed(data: PlaceCreate, embedding: number[]): Promise<PlaceRead> {
        // Used when seeding the dev/test database
        // Avoid triggering the place embedding
        const result = await super.create(data);
        await pgClient.client.$executeRaw`
                UPDATE "Place"
                SET embedding = ${JSON.stringify(embedding)}::vector
                WHERE id = ${result.id}
            `;
        return result;
    }

    async create(data: PlaceCreate) {
        const result = await super.create(data);
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

    async userPost(
        user: UserRead,
        form: PlacePost,
        process: boolean = false
    ): Promise<PlaceRead> {
        const result = await this.userPost(user, form);
        if (process) return await this.postProcess(result);
        return result;
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

    async retrieve(
        id: number | string,
        process: boolean = false
    ): Promise<PlaceRead> {
        const result = await super.retrieve(id);
        if (process) return await this.postProcess(result);
        return result;
    }

    async userRetrieve(
        user: UserRead,
        id: number | string,
        process: boolean = false
    ): Promise<PlaceRead> {
        const result = await this.userRetrieve(user, id);
        if (process) return await this.postProcess(result);
        return result;
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
        query: PrismaFindQuery<PlaceSelect, PlaceOrderBy, PlaceWhere>
    ): PrismaFindQuery<PlaceSelect, PlaceOrderBy, PlaceWhere> {
        if (!query.where) query.where = {} as PlaceWhere;
        query.where.creatorId = { equals: user.id };
        return query;
    }

    async _paginate(
        prismaQuery: PrismaFindQuery<PlaceSelect, PlaceOrderBy, PlaceWhere>
    ): Promise<PaginatedData<Partial<PlaceRead>>> {
        const result = await super._paginate(prismaQuery);
        const data = await this.postProcessBatch(result.data);
        return { ...result, data };
    }

    // Update

    async update(id: number | string, data: PlaceUpdate) {
        const index = this.parseId(id);
        const verification = await this.model.findFirst({
            where: { id: index },
            select: { title: true, description: true },
        });
        if (!verification) {
            throw this.notFoundError(id);
        }

        const descriptionChanged =
            !!data.description && data.description !== verification.description;
        const titleChanged = !!data.title && data.title !== verification.title;
        const updated = await super.update(id, data);
        if (descriptionChanged || titleChanged) {
            placeEmbedding(index);
        }
        return updated;
    }

    async authUpdate(
        user: UserRead,
        id: number | string,
        data: PlacePut
    ): Promise<void> {
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Not Authenticated");
        }

        if (user.isAdmin) return;

        const count = await this.model.count({
            where: { id: this.parseId(id), creatorId: user.id },
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

    async userPut(
        user: UserRead,
        id: number | string,
        form: PlacePut,
        process: boolean = false
    ): Promise<PlaceRead> {
        const result = await this.userPut(user, id, form);
        if (process) return await this.postProcess(result);
        return result;
    }

    async embed(id: number): Promise<number[]> {
        const data = await this.model.findFirst({
            where: { id },
            select: { title: true, description: true },
        });
        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No place with id ${id} found in the database`
            );
        }
        const text = `${data.title} - ${data.description}`;
        const result = await huggingFace.embedText(text);
        const sqlVector = JSON.stringify(result);
        try {
            // vector are not supported by prisma
            await pgClient.client.$executeRaw`
                UPDATE "Place"
                SET embedding = ${sqlVector}::vector
                WHERE id = ${id}
            `;
        } catch (err) {
            if (err instanceof Error) {
                const status = HttpStatus.INTERNAL_SERVER_ERROR;
                const message = "embeddding failed";
                const details = { placeId: id, message: err.message };
                throw new ApiError(status, message, details);
            }
            throw err;
        }
        return result;
    }

    // Delete

    async delete(id: number | string): Promise<void> {
        const object = await this.get(id);
        if (!object) {
            throw this.notFoundError(id);
        }
        await super.delete(id);
        if (object.imageUrl) {
            storage.deleteFile(object.imageUrl);
        }
    }

    async authDelete(user: UserRead, id: number | string): Promise<void> {
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Not Authenticated");
        }

        if (user.isAdmin) return;

        const count = await this.model.count({
            where: { id: this.parseId(id), creatorId: user.id },
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
