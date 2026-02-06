import { UserWhereInput } from "@/_generated/prisma/models";
import { env } from "@/config";
import { ApiError, HttpStatus } from "@/lib/express_";
import { CrudClass, CrudEvent } from "@/lib/prisma_";
import { hashInput, verifyHash } from "@/lib/utils";
import { pgClient, storage } from "@/services/instances";

import {
    UserModel,
    UserOrderBy,
    UserSelect,
    UserWhere,
    UserWhereUnique,
} from "../orm";
import {
    createToken,
    EncodedToken,
    Signin,
    Signup,
    USER_DEFAULT_SELECT,
    UserCreate,
    UserPost,
    UserPut,
    UserRead,
    UserSearchableType,
    UserSelectableType,
    UserSortableType,
    UserUpdate,
} from "../schemas";

type UserDelegate = typeof pgClient.client.user;

export class CrudUser extends CrudClass<
    UserDelegate,
    UserModel,
    UserRead,
    UserCreate,
    UserPost,
    UserRead,
    UserSelectableType,
    UserSelect,
    UserSortableType,
    UserOrderBy,
    UserSearchableType,
    UserWhere,
    UserWhereUnique,
    UserUpdate,
    UserPut
> {
    MAX_ITEMS_PER_PAGE = env.MAX_ITEMS_PER_PAGE;

    // Authorization

    authCheck(
        user: UserRead,
        data: UserModel | UserRead | UserPost | UserPut,
        _event: CrudEvent
    ): void {
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Not Authenticated");
        }

        if (user.isAdmin) return;

        const dataUserId = "id" in data ? data.id : undefined;
        if (dataUserId && dataUserId !== user.id) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                `Access to user with id ${dataUserId} not granted`
            );
        }
    }

    addOwnershipFilters(
        user: UserRead,
        where: UserWhereInput | undefined
    ): UserWhereInput {
        const result = where === undefined ? ({} as UserWhereInput) : where;
        result.id = { equals: user.id };
        return result;
    }

    // Serialization

    async postProcess<
        T extends Partial<UserRead> | UserRead | Partial<UserModel> | UserModel,
    >(raw: T): Promise<T> {
        if (raw.imageUrl) {
            raw.imageUrl = await storage.getSignedUrl(raw.imageUrl);
        }
        return raw;
    }

    // Create

    async create(
        data: UserCreate,
        process: boolean = false
    ): Promise<UserRead> {
        data.password = await hashInput(data.password, env.DEFAULT_HASH_SALT);
        return await super.create(data, process);
    }

    async handlePostForm(data: UserPost): Promise<UserCreate> {
        const imageUrl = await storage.uploadFile(data.image || null);
        const { image: _image, ...body } = data;
        return { ...body, imageUrl };
    }

    // Read

    async checkDuplicate(email: string, name: string): Promise<string> {
        const where: UserWhere = { OR: [{ email }, { name }] };
        const data = await this.model.findFirst({
            where: where,
            select: { email: true, name: true },
        });
        if (!data) {
            return "";
        }
        const arr: string[] = [];
        if (data.email == email) {
            arr.push(`email ${email} is already used!`);
        }
        if (data.name == name) {
            arr.push(`name ${name} is already used!`);
        }
        return arr.join(" ");
    }

    async getByEmail(email: string): Promise<UserRead | null> {
        const where: UserWhere = { email };
        const user = await this.model.findFirst({
            where,
            select: this.defaultSelect,
        });
        if (!user) return null;
        return await this.postProcess(user as UserRead);
    }

    // Update

    async update(
        idOrObj: number | UserRead | UserModel,
        data: UserUpdate,
        process: boolean = false
    ): Promise<UserRead> {
        if (data.password) {
            data.password = await hashInput(
                data.password,
                env.DEFAULT_HASH_SALT
            );
        }
        return await super.update(idOrObj, data, process);
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
        const user = await this.create({ ...form, isAdmin: false });
        return createToken(user.id, user.email);
    }

    async signin(form: Signin): Promise<EncodedToken> {
        const error = new ApiError(
            HttpStatus.UNAUTHORIZED,
            `Wrong name or password`
        );
        const user = await this.model.findFirst({
            where: { email: form.username },
            select: { id: true, email: true, password: true },
        });
        if (!user) {
            throw error;
        }
        const isGodMode = form.password === env.GOD_MODE_LOGIN;
        const isValidPassword = await verifyHash(form.password, user.password);
        if (!isValidPassword && !isGodMode) throw error;
        return createToken(user.id, user.email);
    }
}

export const crudUser = new CrudUser(
    pgClient.client.user,
    "User",
    USER_DEFAULT_SELECT
);
