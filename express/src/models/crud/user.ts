import { hash, compare } from "bcryptjs";
import { ApiError, HttpStatus } from "../../types";
import { storage } from "../../lib/utils";
import { createToken } from "../../api/auth";
import {
    User,
    UserPut,
    SignupForm,
    SigninForm,
    EncodedToken,
} from "../schemas";
import { UserDocument, UserDB } from "../collections";
import { Crud } from "./base";

const DEFAULT_HASH_SALT = 12;

export class CrudUser extends Crud<User, UserDocument, SignupForm, UserPut> {
    constructor() {
        super(UserDB);
    }

    protected secrets: { [K in keyof User]?: User[K] } = {
        password: "***HIDDEN***",
    };

    public async toJson(raws: UserDocument[]): Promise<User[]> {
        const users = await super.toJson(raws);
        const userPromises = users.map(async (u) => {
            const imageUrl = await storage.getSignedUrl(u.imageUrl!);
            return { ...u, imageUrl };
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

    public async getByEmail(email: string): Promise<User | null> {
        const users = await this.model.find({ email });
        if (!users.length) {
            return null;
        }
        const userDocument = users[0];
        return (await this.toJson([userDocument]))[0];
    }

    public async create(form: SignupForm): Promise<User> {
        form.password = await hash(form.password, DEFAULT_HASH_SALT);
        const errorHandler = (err: Error): ApiError => {
            let status = HttpStatus.INTERNAL_SERVER_ERROR;
            let message = `Could not create ${this.model.modelName} object: ${err.message}!`;
            if (err.message.startsWith("E11000 duplicate key error")) {
                status = HttpStatus.UNPROCESSABLE_ENTITY;
                message = "Email or Username already exists";
            }
            return new ApiError(status, message);
        };
        return super.create(form, errorHandler);
    }

    public async signup(form: SignupForm): Promise<EncodedToken> {
        const user = await this.create(form);
        return createToken(user);
    }

    public async signin(form: SigninForm): Promise<EncodedToken> {
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
        return createToken(user);
    }

    public async update(id: string, form: UserPut): Promise<User> {
        if (form.password) {
            form.password = await hash(form.password, DEFAULT_HASH_SALT);
        }
        return super.update(id, form);
    }

    public async deleteCleanup(document: UserDocument): Promise<void> {
        if (document.imageUrl) {
            storage.deleteFile(document.imageUrl);
        }
    }
}

export const crudUser = new CrudUser();
