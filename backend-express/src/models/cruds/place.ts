import { EntityManager } from "typeorm";

import { placeEmbedding } from "@/background/publishers";
import { env } from "@/config";
import { CrudsClass } from "@/lib/typeorm_";
import { ApiError, HttpStatus } from "@/lib/types";
import { huggingFace, pgClient, storage } from "@/services/instances";

import { Models, Place } from "../orm";
import {
    PlaceCreate,
    PlacePost,
    PlacePut,
    PlaceRead,
    PlaceSearchableType,
    PlaceSearchQuery,
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

    async afterCreate(
        _manager: EntityManager,
        id: number,
        _data: PlaceCreate,
        _context: Record<string, any>
    ): Promise<void> {
        placeEmbedding(id);
    }

    async seed(data: PlaceCreate, embedding: number[]): Promise<number> {
        // Used when seeding the dev/test database
        // Avoid triggering the place embedding
        const id = await super.create(data);
        await this.updateEmbedding(id, embedding);
        return id;
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

    authGet(user: UserRead, query: PlaceSearchQuery): PlaceSearchQuery {
        if (!query.where) query.where = {};
        query.where.creatorId = this.eq(user.id);
        return query;
    }

    // Update

    async beforeUpdate(
        manager: EntityManager,
        id: number,
        data: PlaceUpdate
    ): Promise<Record<string, any>> {
        const record = await manager.findOne(Place, {
            where: { id },
            select: ["title", "description"],
        });
        if (!record) {
            throw this.notFoundError(id);
        }

        const titleChanged = !!data.title && data.title !== record.title;
        const descriptionChanged =
            !!data.description && data.description !== record.description;
        if (descriptionChanged || titleChanged) {
            return { triggerEmbedding: true };
        }
        return { triggerEmbedding: false };
    }

    async afterUpdate(
        _manager: EntityManager,
        id: number,
        _data: PlaceUpdate,
        context: Record<string, any>
    ): Promise<void> {
        if (context.triggerEmbedding == undefined) {
            throw new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "something went wrong after trying to update place recod"
            );
        }

        if (context.triggerEmbedding) {
            placeEmbedding(id);
        }
    }

    async authPut(
        user: UserRead,
        id: number | string,
        _data: PlacePut
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

    async afterDelete(_manager: EntityManager, obj: Place): Promise<void> {
        if (obj.imageUrl) {
            storage.deleteFile(obj.imageUrl);
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
}

export const crudsPlace = new CrudsPlace(
    pgClient.client,
    Models.place,
    placeSelectableFields,
    ["createdAt"]
);
