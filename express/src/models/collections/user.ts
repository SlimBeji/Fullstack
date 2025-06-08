import { model, Schema } from "mongoose";
import { CollectionEnum } from "../../types";

import { User } from "../schemas";

const UserCollectionSchema = new Schema<User>(
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
                ref: CollectionEnum.PLACE,
            },
        ],
    },
    { timestamps: true }
);
UserCollectionSchema.index({ createdAt: 1 });

export const UserDB = model<User>(CollectionEnum.USER, UserCollectionSchema);

export type UserDocument = InstanceType<typeof UserDB>;
