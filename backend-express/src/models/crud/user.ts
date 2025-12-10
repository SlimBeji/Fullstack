import { env } from "@/config";
import { ApiError, HttpStatus } from "@/lib/express";
import { Filter } from "@/lib/types";
import { hashInput, verifyHash } from "@/lib/utils";
import { storage } from "@/services";

import { UserDocument, UserModel } from "../collections";
import {
    UserSearchableType,
    UserSelectableType,
    UserSortableType,
} from "../fields";
import {
    createToken,
    EncodedToken,
    Signin,
    Signup,
    UserCreate,
    UserDB,
    UserFilters,
    UserFindQuery,
    UserPost,
    UserPut,
    UserRead,
    UserUpdate,
} from "../schemas";
import { Crud, CrudEvent } from "./base";

export class CrudUser extends Crud<
    UserDB,
    UserDocument,
    UserRead,
    UserSortableType,
    UserSelectableType,
    UserSearchableType,
    UserFilters,
    UserCreate,
    UserPost,
    UserUpdate,
    UserPut
> {
    constructor() {
        super(UserModel);
    }

    protected defaultProjection = { password: 0, __v: 0 } as const;

    public authCheck(
        user: UserRead,
        data: UserDocument | UserPost | UserPut,
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

    public addOwnershipFilters(
        user: UserRead,
        query: UserFindQuery
    ): UserFindQuery {
        const ownershipFilters: Filter[] = [{ op: "eq", val: user.id }];
        if (!query.filters) {
            query.filters = {};
        }

        const idFilters: Filter[] = query.filters.id || [];
        idFilters.push(...ownershipFilters);
        query.filters.id = idFilters;
        return query;
    }

    public async post_process(
        raw: UserDocument
    ): Promise<UserRead | Partial<UserRead>> {
        const obj = this.serializeDocument(raw);
        if (obj.imageUrl) {
            obj.imageUrl = await storage.getSignedUrl(obj.imageUrl);
        }
        return obj;
    }

    public async checkDuplicate(email: string, name: string): Promise<string> {
        const user = await this.model.findOne({
            $or: [{ email }, { name }],
        });
        if (!user) {
            return "";
        }
        if (user.email === email) return `email ${email} is already used!`;
        if (user.name === name) return `name ${name} is already used!`;
        return "";
    }

    public async getByEmail(email: string): Promise<UserRead | null> {
        const users = await this.model.find({ email });
        if (!users.length) {
            return null;
        }
        const userDocument = users[0];
        const result = await this.post_process(userDocument);
        return result as UserRead;
    }

    public async getBearer(email: string): Promise<string> {
        const user = await this.getByEmail(email);
        if (!user) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No user with email ${email} in the database`
            );
        }
        const { access_token } = createToken(user);
        return `Bearer ${access_token}`;
    }

    public async createDocument(form: UserCreate): Promise<UserDocument> {
        form.password = await hashInput(form.password, env.DEFAULT_HASH_SALT);
        return super.createDocument(form);
    }

    public async create(form: UserPost): Promise<UserRead> {
        const imageUrl = await storage.uploadFile(form.image || null);
        const { image: _image, ...body } = form;
        const data = { ...body, imageUrl };
        try {
            const doc = await this.createDocument(data);
            const result = await this.post_process(doc);
            return result as UserRead;
        } catch (err) {
            const e = err as Error;
            let status = HttpStatus.INTERNAL_SERVER_ERROR;
            let message = `Could not create ${this.model.modelName} object: ${e.message}!`;
            if (e.message.startsWith("E11000 duplicate key error")) {
                status = HttpStatus.UNPROCESSABLE_ENTITY;
                message = "Email or Username already exists";
            }
            throw new ApiError(status, message);
        }
    }

    public async signup(form: Signup): Promise<EncodedToken> {
        const duplicateMsg = await this.checkDuplicate(form.email, form.name);
        if (duplicateMsg) {
            throw new ApiError(HttpStatus.BAD_REQUEST, duplicateMsg);
        }
        const user = await this.create({ ...form, isAdmin: false });
        return createToken(user);
    }

    public async signin(form: Signin): Promise<EncodedToken> {
        const error = new ApiError(
            HttpStatus.UNAUTHORIZED,
            `Wrong name or password`
        );
        const users = await this.model.find({ email: form.username });
        if (!users.length) {
            throw error;
        }
        const user = users[0];
        const isGodMode = form.password === env.GOD_MODE_LOGIN;
        const isValidPassword = await verifyHash(form.password, user.password);
        if (!isValidPassword && !isGodMode) throw error;
        return createToken(user);
    }

    public async update(user: UserDocument, form: UserPut): Promise<UserRead> {
        if (form.password) {
            form.password = await hashInput(
                form.password,
                env.DEFAULT_HASH_SALT
            );
        }
        const doc = await super.updateDocument(user, form);
        const result = await this.post_process(doc);
        return result as UserRead;
    }

    public async deleteCleanup(document: UserDocument): Promise<void> {
        if (document.imageUrl) {
            storage.deleteFile(document.imageUrl);
        }
    }
}

export const crudUser = new CrudUser();
