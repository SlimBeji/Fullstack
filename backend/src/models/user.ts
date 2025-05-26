import { model, Schema } from "mongoose";
import { CollectionEnum } from "../types";

import { User } from "../schemas";

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

export type UserDocument = InstanceType<typeof UserDB>;
