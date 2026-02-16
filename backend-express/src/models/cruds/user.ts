import { env } from "@/config";
import { ApiError, HttpStatus } from "@/lib/express_";
import { CrudsClass, SelectField } from "@/lib/typeorm_";
import { FindQuery, PaginatedData } from "@/lib/types";
import { hashInput, verifyHash } from "@/lib/utils";
import { pgClient, storage } from "@/services/instances";

import { Models, User } from "../orm";
import {
    createToken,
    EncodedToken,
    Signin,
    Signup,
    UserCreate,
    UserPost,
    UserPut,
    UserRead,
    UserSearchableType,
    userSelectableFields,
    UserSelectableType,
    UserSortableType,
    UserUpdate,
} from "../schemas";

export class CrudsUser extends CrudsClass<
    User,
    UserRead,
    UserCreate,
    UserPost,
    UserRead,
    UserSelectableType,
    UserSortableType,
    UserSearchableType,
    UserUpdate,
    UserPut
> {
    MAX_ITEMS_PER_PAGE = env.MAX_ITEMS_PER_PAGE;

    // Post-Processing

    async postProcess<T extends Partial<UserRead> | UserRead>(
        raw: T
    ): Promise<T> {
        if (raw.imageUrl) {
            raw.imageUrl = await storage.getSignedUrl(raw.imageUrl);
        }
        return raw;
    }

    // Query Building

    mapSelect(field: string): SelectField[] {
        switch (field) {
            case "places":
                const userPlaceJoins = [
                    { table: "places", relation: "users.places", level: 1 },
                ];
                return [
                    { select: "places.id", joins: userPlaceJoins },
                    { select: "places.title", joins: userPlaceJoins },
                    { select: "places.address", joins: userPlaceJoins },
                ];
            default:
                return super.mapSelect(field);
        }
    }

    // Create

    async create(data: UserCreate): Promise<number> {
        data.password = await hashInput(data.password, env.DEFAULT_HASH_SALT);
        return await super.create(data);
    }

    async postToCreate(data: UserPost): Promise<UserCreate> {
        const imageUrl = await storage.uploadFile(data.image || null);
        const { image: _image, ...body } = data;
        return { ...body, imageUrl };
    }

    async authPost(user: UserRead, _data: UserPost): Promise<void> {
        // only admins can create users
        if (user && user.isAdmin) return;
        throw new ApiError(HttpStatus.UNAUTHORIZED, "Not Authenticated", {
            message: "Only admins can delete users",
        });
    }

    async userPost(
        user: UserRead,
        form: UserPost,
        process: boolean = false
    ): Promise<UserRead> {
        const result = await super.userPost(user, form);
        if (process) return await this.postProcess(result);
        return result;
    }

    // Read

    async get(
        id: number | string,
        process: boolean = false
    ): Promise<UserRead> {
        const result = await super.get(id);
        if (process) return await this.postProcess(result);
        return result;
    }

    async authGet(user: UserRead, data: UserRead): Promise<void> {
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Not Authenticated");
        }

        if (user.isAdmin) return;

        if (user.id !== data.id) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                `Access to user with id ${data.id} not granted`
            );
        }
    }

    async userGet(
        user: UserRead,
        id: number | string,
        process: boolean = false
    ): Promise<UserRead> {
        const result = await super.userGet(user, id);
        if (process) return await this.postProcess(result);
        return result;
    }

    async checkDuplicate(email: string, name: string): Promise<string> {
        const arr = [];

        const emailExists = await this.exists({ email: this.eq(email) });
        if (emailExists) arr.push(`email ${email} already in use.`);

        const nameExists = await this.exists({ name: this.eq(name) });
        if (nameExists) arr.push(`username ${name} already in use.`);

        return arr.join(" ");
    }

    async getByEmail(email: string): Promise<UserRead | null> {
        const query = {
            select: [...this.defaultSelect],
            where: { email: this.eq(email) },
        };
        const ormQuery = this.buildSelectQuery(query);
        const result = await ormQuery.getOne();
        if (!result) return null;
        // Using this.defaultSelect as select should gives a Read schema
        return result as any as UserRead;
    }

    // Update

    async update(id: number | string, data: UserUpdate): Promise<void> {
        if (data.password) {
            data.password = await hashInput(
                data.password,
                env.DEFAULT_HASH_SALT
            );
        }
        return await super.update(id, data);
    }

    async authPut(
        user: UserRead,
        id: number | string,
        _form: UserPut
    ): Promise<void> {
        // Only the user and admins can update their informations
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Not Authenticated");
        }

        if (user.isAdmin) return;

        if (user.id !== this.parseId(id)) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                `Access to user with id ${id} not granted`
            );
        }
    }

    async userPut(
        user: UserRead,
        id: number | string,
        form: UserPut,
        process: boolean = false
    ): Promise<UserRead> {
        const result = await super.userPut(user, id, form);
        if (process) return await this.postProcess(result);
        return result;
    }

    // Delete

    async delete(id: number | string): Promise<void> {
        const object = await this.find(id);
        if (!object) {
            throw this.notFoundError(id);
        }
        await super.delete(id);
        if (object.imageUrl) {
            storage.deleteFile(object.imageUrl);
        }
    }

    async authDelete(user: UserRead, _id: number | string): Promise<void> {
        if (user && user.isAdmin) {
            return;
        }

        throw new ApiError(HttpStatus.UNAUTHORIZED, "Not Authenticated", {
            message: "Only admins can delete users",
        });
    }

    // Search

    authSearch(
        user: UserRead,
        query: FindQuery<
            UserSelectableType,
            UserSortableType,
            UserSearchableType
        >
    ): FindQuery<UserSelectableType, UserSortableType, UserSearchableType> {
        // User can only access his profile in secure mode
        if (!query.where) query.where = {};
        query.where.id = this.eq(user.id);
        return query;
    }

    async paginate(
        query: FindQuery<
            UserSelectableType,
            UserSortableType,
            UserSearchableType
        >
    ): Promise<PaginatedData<Partial<UserRead>>> {
        const result = await super.paginate(query);
        const data = await this.postProcessBatch(result.data);
        return { ...result, data };
    }

    // Auth methods

    async getBearer(email: string): Promise<string> {
        const user = await this.getByEmail(email);
        if (!user) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No user with email ${email} in the database`
            );
        }
        const { access_token } = createToken(user.id, user.email);
        return `Bearer ${access_token}`;
    }

    async signup(form: Signup): Promise<EncodedToken> {
        const duplicateMsg = await this.checkDuplicate(form.email, form.name);
        if (duplicateMsg) {
            throw new ApiError(HttpStatus.BAD_REQUEST, duplicateMsg);
        }
        const data = {
            name: form.name,
            email: form.email,
            password: form.password,
            isAdmin: false,
            image: form.image,
        };
        const user = await this.post(data);
        return createToken(user.id, user.email);
    }

    async signin(form: Signin): Promise<EncodedToken> {
        const error = new ApiError(
            HttpStatus.UNAUTHORIZED,
            `Wrong name or password`
        );

        const record = (await this.repository.findOne({
            where: { email: form.username },
            select: { id: true, email: true, password: true },
        })) as Pick<User, "id" | "email" | "password"> | null;
        if (!record) {
            throw error;
        }
        const isGodMode = form.password === env.GOD_MODE_LOGIN;
        const isValidPassword = await verifyHash(
            form.password,
            record.password
        );
        if (!isValidPassword && !isGodMode) throw error;
        return createToken(record.id, record.email);
    }
}

export const crudsUser = new CrudsUser(
    pgClient.client,
    Models.user,
    userSelectableFields,
    ["createdAt"]
);
