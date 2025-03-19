import { model } from "mongoose";
import { Crud, ApiError, HttpStatus } from "../framework";

import {
    CollectionEnum,
    User,
    UserDBSchema,
    UserPut,
    SignupForm,
    SigninForm,
} from "../schemas";

const UserDB = model<User>(CollectionEnum.USER, UserDBSchema);

type UserDocument = InstanceType<typeof UserDB>;

export class CrudUser extends Crud<User, UserDocument, SignupForm, UserPut> {
    constructor() {
        super(UserDB);
    }

    protected secrets: { [K in keyof User]?: User[K] } = {
        password: "***HIDDEN***",
    };

    public authenticate = async (form: SigninForm): Promise<User> => {
        const users = await this.model.find({ name: form.name });
        const error = new ApiError(
            HttpStatus.UNAUTHORIZED,
            `Wrong name or password`
        );
        if (!users) throw error;
        const user = users[0];
        if (user.password !== form.password) throw error;
        return this.toJson([user])[0];
    };
}

export const crudUser = new CrudUser();
