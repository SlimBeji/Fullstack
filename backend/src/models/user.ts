import { model, Schema } from "mongoose";
import { hash, compare } from "bcryptjs";
import { HttpStatus } from "../enums";
import { ApiError } from "../types";
import { storage } from "../utils";
import { createToken, EncodedUserToken } from "../auth";
import { Crud } from "./base";

import {
    CollectionEnum,
    User,
    UserPut,
    SignupForm,
    SigninForm,
} from "../schemas";

const DEFAULT_HASH_SALT = 12;

const UserDBSchema = new Schema<User>({
    // Fields
    name: { type: String, required: true, unique: true, min: 2 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, min: 8 },
    imageUrl: { type: String, required: false },
    isAdmin: { type: Boolean, required: true, default: false },
    // Relations
    places: [
        {
            type: Schema.ObjectId,
            required: true,
            ref: CollectionEnum.PLACE,
        },
    ],
});

export const UserDB = model<User>(CollectionEnum.USER, UserDBSchema);

type UserDocument = InstanceType<typeof UserDB>;

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

    public checkDuplicate = async (
        email: string,
        name: string
    ): Promise<string> => {
        const user = await this.model.findOne({
            $or: [{ email }, { name }],
        });
        if (!user) {
            return "";
        }
        if (user.email === email) return `email ${email} is already used!`;
        if (user.name === name) return `name ${name} is already used!`;
        return "";
    };

    public getByEmail = async (email: string): Promise<User | null> => {
        const users = await this.model.find({ email });
        if (!users.length) {
            return null;
        }
        const userDocument = users[0];
        return (await this.toJson([userDocument]))[0];
    };

    public create = async (form: SignupForm): Promise<User> => {
        form.password = await hash(form.password, DEFAULT_HASH_SALT);
        const errorHandler = (err: Error): [HttpStatus, string] => {
            let status = HttpStatus.INTERNAL_SERVER_ERROR;
            let message = `Could not create ${this.model.modelName} object: ${err.message}!`;
            if (err.message.startsWith("E11000 duplicate key error")) {
                status = HttpStatus.UNPROCESSABLE_ENTITY;
                message = "Email or Username already exists";
            }
            return [status, message];
        };
        return super.create(form, errorHandler);
    };

    public signup = async (form: SignupForm): Promise<EncodedUserToken> => {
        const user = await this.create(form);
        return createToken(user);
    };

    public signin = async (form: SigninForm): Promise<EncodedUserToken> => {
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
    };

    public update = async (id: string, form: UserPut): Promise<User> => {
        if (form.password) {
            form.password = await hash(form.password, DEFAULT_HASH_SALT);
        }
        return super.update(id, form);
    };

    public async deleteCleanup(document: UserDocument): Promise<void> {
        if (document.imageUrl) {
            storage.deleteFile(document.imageUrl);
        }
    }
}

export const crudUser = new CrudUser();
