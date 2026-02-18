import { placeEmbedding } from "@/background/publishers";
import { env } from "@/config";
import { ApiError, HttpStatus } from "@/lib/express_";
import { CrudsClass } from "@/lib/typeorm_";
import { FindQuery, PaginatedData } from "@/lib/types";
import { huggingFace, pgClient, storage } from "@/services/instances";

import { Models, Place } from "../orm";
import {
    PlaceCreate,
    PlacePost,
    PlacePut,
    PlaceRead,
    PlaceSearchableType,
    placeSelectableFields,
    PlaceSelectableType,
    PlaceSortableType,
    PlaceUpdate,
    UserRead,
} from "../schemas";
import { userExists } from "./utils";

export type PlaceOptions = {
    process?: boolean;
    fields?: PlaceSelectableType[];
};

export class CrudsPlace extends CrudsClass<
    Place,
    UserRead,
    PlaceCreate,
    PlacePost,
    PlaceRead,
    PlaceSelectableType,
    PlaceSortableType,
    PlaceSearchableType,
    PlaceUpdate,
    PlacePut,
    PlaceOptions
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

    // Query Building

    mapWhere(field: string): string {
        switch (field) {
            case "locationLat":
                return `(location->>'lat')::float`;
            case "locationLng":
                return `(location->>'lng')::float`;
            default:
                return this.fieldAlias(field);
        }
    }

    // Create

    async create(data: PlaceCreate) {
        const id = await super.create(data);
        placeEmbedding(id);
        return id;
    }

    async seed(data: PlaceCreate, embedding: number[]): Promise<PlaceRead> {
        // Used when seeding the dev/test database
        // Avoid triggering the place embedding
        const id = await super.create(data);
        await this.updateEmbedding(id, embedding);
        return await this.get(id);
    }

    async postToCreate(form: PlacePost): Promise<PlaceCreate> {
        const imageUrl = await storage.uploadFile(form.image || null);
        const { image: _image, lat, lng, ...body } = form;
        return { ...body, imageUrl, location: { lat, lng } };
    }

    async authPost(user: UserRead, data: PlacePost): Promise<void> {
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Not Authenticated");
        }

        if (user.isAdmin) {
            const exists = await userExists(this.datasource, data.creatorId);
            if (!exists) {
                throw new ApiError(HttpStatus.NOT_FOUND, "User not found", {
                    message: `Cannot set creatorId to ${data.creatorId}, No user with id ${data.creatorId} found in the database`,
                });
            }
        }

        if (user.id != data.creatorId) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Access denied", {
                message: `Cannot add places to user ${data.creatorId}`,
            });
        }
    }

    // Read

    async get(
        id: number | string,
        options: PlaceOptions = {} as PlaceOptions
    ): Promise<PlaceRead> {
        const result = await super.get(id, options);
        if (options?.process) return await this.postProcess(result);
        return result;
    }

    async authGet(user: UserRead, data: PlaceRead): Promise<void> {
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

    // Update

    async update(id: number | string, data: PlaceUpdate): Promise<void> {
        const index = this.parseId(id);
        const record = await this.read(id);
        if (!record) {
            throw this.notFoundError(id);
        }

        const descriptionChanged =
            !!data.description && data.description !== record.description;
        const titleChanged = !!data.title && data.title !== record.title;
        const updated = await super.update(id, data);
        if (descriptionChanged || titleChanged) {
            placeEmbedding(index);
        }
        return updated;
    }

    async authPut(
        user: UserRead,
        id: number | string,
        data: PlacePut
    ): Promise<void> {
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Not Authenticated");
        }

        if (user.isAdmin) return;

        const check = await this.exists({
            id: this.eq(id),
            creatorId: this.eq(user.id),
        });
        if (!check) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Access denied", {
                message: `Cannot not access place ${id}`,
            });
        }

        if (data.creatorId) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Access denied", {
                message: `Cannot set creatorId to ${data.creatorId}`,
            });
        }
    }

    async updateEmbedding(
        id: number | string,
        vector: number[]
    ): Promise<void> {
        await this.repository
            .createQueryBuilder()
            .update()
            .set({
                embedding: () => `'${JSON.stringify(vector)}'::vector`,
            })
            .where("id = :id", { id })
            .execute();
    }

    async embed(id: number): Promise<number[]> {
        const data = (await this.repository.findOne({
            where: { id },
            select: { title: true, description: true },
        })) as Pick<Place, "title" | "description">;
        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No place with id ${id} found in the database`
            );
        }
        const text = `${data.title} - ${data.description}`;
        const result = await huggingFace.embedText(text);
        try {
            await this.updateEmbedding(id, result);
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

        const check = await this.exists({
            id: this.eq(id),
            creatorId: this.eq(user.id),
        });
        if (!check) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Access denied", {
                message: `Cannot not access place ${id}`,
            });
        }
    }

    // Search

    authSearch(
        user: UserRead,
        query: FindQuery<
            PlaceSelectableType,
            PlaceSortableType,
            PlaceSearchableType
        >
    ): FindQuery<PlaceSelectableType, PlaceSortableType, PlaceSearchableType> {
        if (!query.where) query.where = {};
        query.where.creatorId = this.eq(user.id);
        return query;
    }

    async paginate(
        query: FindQuery<
            PlaceSelectableType,
            PlaceSortableType,
            PlaceSearchableType
        >
    ): Promise<PaginatedData<Partial<PlaceRead>>> {
        const result = await super.paginate(query);
        const data = await this.postProcessBatch(result.data);
        return { ...result, data };
    }
}

export const crudsPlace = new CrudsPlace(
    pgClient.client,
    Models.place,
    placeSelectableFields,
    ["createdAt"]
);
