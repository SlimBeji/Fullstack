import { hash, compare } from "bcryptjs";
import { ApiError, FilterQuery, HttpStatus } from "../../types";
import { storage } from "../../lib/utils";
import { createToken } from "../../api/auth";
import {
    UserDB,
    UserCreate,
    UserPut,
    UserRead,
    UserPost,
    UserUpdate,
    Signin,
    Signup,
    EncodedToken,
} from "../schemas";
import { UserDocument, UserModel } from "../collections";
import { Crud } from "./base";

const DEFAULT_HASH_SALT = 12;

export class CrudUser extends Crud<
    UserDB,
    UserDocument,
    UserRead,
    UserCreate,
    UserPost,
    UserUpdate,
    UserPut
> {
    constructor() {
        super(UserModel);
    }

    public safeCheck(
        user: UserRead,
        data: UserDocument | UserPost | UserCreate
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

    public safeFilter(user: UserRead, filterQuery: FilterQuery): FilterQuery {
        const { sort, filters, pagination } = filterQuery;
        if (filters) {
            filters.id = { $eq: user.id };
        }
        return { sort, filters, pagination };
    }

    public async jsonifyBatch(docs: UserDocument[]): Promise<UserRead[]> {
        const userPromises = docs.map(async (doc) => {
            // Removing the password field
            const { password, ...obj } = this.serializeDocument(doc);
            let imageUrl = "";
            if (obj.imageUrl)
                imageUrl = await storage.getSignedUrl(obj.imageUrl);
            return { ...obj, imageUrl };
        });
        return await Promise.all(userPromises);
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
        return await this.jsonfify(userDocument);
    }

    public async getBearer(email: string): Promise<string> {
        const user = await this.getByEmail(email);
        if (!user) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No user with email ${email} in the database`
            );
        }
        const { token } = await createToken(user);
        return `Bearer ${token}`;
    }

    public async createDocument(form: UserCreate): Promise<UserDocument> {
        form.password = await hash(form.password, DEFAULT_HASH_SALT);
        return await super.createDocument(form);
    }

    public async create(form: UserPost): Promise<UserRead> {
        const imageUrl = await storage.uploadFile(form.image || null);
        const { image, ...body } = form;
        const data = { ...body, imageUrl };
        try {
            const doc = await this.createDocument(data);
            return this.jsonfify(doc);
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
        return await createToken(user);
    }

    public async signin(form: Signin): Promise<EncodedToken> {
        const error = new ApiError(
            HttpStatus.UNAUTHORIZED,
            `Wrong name or password`
        );
        const users = await this.model.find({ email: form.email });
        if (!users.length) {
            throw error;
        }
        const user = users[0];
        const isValidPassword = await compare(form.password, user.password);
        if (!isValidPassword) throw error;
        return await createToken(user);
    }

    public async update(user: UserDocument, form: UserPut): Promise<UserRead> {
        if (form.password) {
            form.password = await hash(form.password, DEFAULT_HASH_SALT);
        }
        const doc = await super.updateDocument(user, form);
        return this.jsonfify(doc);
    }

    public async deleteCleanup(document: UserDocument): Promise<void> {
        if (document.imageUrl) {
            storage.deleteFile(document.imageUrl);
        }
    }
}

export const crudUser = new CrudUser();
