import { model, Schema } from "mongoose";
import { Crud, ApiError, HttpStatus } from "../framework";

import {
    CollectionEnum,
    User,
    UserPut,
    SignupForm,
    SigninForm,
} from "../schemas";

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

    public authenticate = async (form: SigninForm): Promise<User> => {
        const users = await this.model.find({ email: form.email });
        const error = new ApiError(
            HttpStatus.UNAUTHORIZED,
            `Wrong name or password`
        );
        if (!users.length) throw error;
        const user = users[0];
        if (user.password !== form.password) throw error;
        return this.toJson([user])[0];
    };

    public create = async (form: SignupForm): Promise<User> => {
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
}

export const crudUser = new CrudUser();
