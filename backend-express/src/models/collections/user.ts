import { model, Schema } from "mongoose";
import { CollectionEnum } from "../../types";

import { UserDB } from "../schemas";

const UserCollectionSchema = new Schema<UserDB>(
    {
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
                ref: CollectionEnum.PLACES,
            },
        ],
    },
    { timestamps: true }
);
UserCollectionSchema.index({ createdAt: 1 });

export const UserModel = model<UserDB>(
    CollectionEnum.USERS,
    UserCollectionSchema
);

export type UserDocument = InstanceType<typeof UserModel>;
