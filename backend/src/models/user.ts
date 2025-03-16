import { v4 as uuid } from "uuid";
import { ApiError, HttpStatus } from "../framework";
import { User, UserPut, SignupForm, SigninForm } from "../schemas";

export class CrudUser {
    constructor(public collection: string = "user") {}
    public hideUserSecrets = (users: User[]): User[] => {
        const secrets: { [K in keyof User]?: User[K] } = {
            password: "***HIDDEN***",
        };
        return users.map((u) => {
            return {
                ...u,
                ...secrets,
            };
        });
    };
    public authenticate = (form: SigninForm): User => {
        const user = DUMMY_USERS.find((u) => u.name === form.name);
        const error = new ApiError(
            HttpStatus.UNAUTHORIZED,
            `Wrong name or password`
        );
        if (!user) throw error;
        if (user.password !== form.password) throw error;
        return this.hideUserSecrets([user])[0];
    };
    public userLookup = <K extends keyof User>(
        identifier: User[K],
        fieldName: K = "id" as K
    ): User[] => {
        let users: User[];
        if (identifier === "*") {
            users = DUMMY_USERS;
        } else {
            users = DUMMY_USERS.filter((el) => {
                return el[fieldName] === identifier;
            });
        }

        if (!users.length) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No user with field ${fieldName} equal to ${identifier}!`
            );
        }

        return this.hideUserSecrets(users);
    };
    public createUser = (form: SignupForm): User => {
        const newUser: User = {
            id: uuid(),
            isAdmin: false,
            ...form,
        };
        DUMMY_USERS.push(newUser);
        return this.hideUserSecrets([newUser])[0];
    };
    public updateUser = <K extends keyof User>(
        identifier: User[K],
        form: UserPut,
        fieldName: K = "id" as K
    ): User => {
        const user = this.userLookup(identifier, fieldName)[0];
        const userIndex = DUMMY_USERS.findIndex((el) => el.id === user.id);
        const updatedUser = { ...DUMMY_USERS[userIndex], ...form };
        DUMMY_USERS[userIndex] = updatedUser;
        return this.hideUserSecrets([updatedUser])[0];
    };
    public deleteUser = <K extends keyof User>(
        identifier: User[K],
        fieldName: K = "id" as K
    ): void => {
        const user = this.userLookup(identifier, fieldName)[0];
        const userIndex = DUMMY_USERS.findIndex((el) => el.id === user.id);
        DUMMY_USERS.splice(userIndex, 1);
    };
}

export const crudUser = new CrudUser();

export const DUMMY_USERS: User[] = [
    {
        id: "12afa5af-f632-42bf-875a-c91038614dba",
        name: "Slim",
        email: "mslimbeji@gmail.com",
        password: "very_very_secret",
        imageUrl:
            "https://img.delicious.com.au/DGZCHR1s/del/2018/12/paris-france-97370-2.jpg",
        isAdmin: true,
    },
    {
        id: "25163b14-4da1-41ef-a4c1-830b3e09f4d3",
        name: "MSB",
        email: "beji.slim@yahoo.fr",
        password: "very_secret",
        imageUrl:
            "https://img.delicious.com.au/DGZCHR1s/del/2018/12/paris-france-97370-2.jpg",
        isAdmin: false,
    },
];
