import { model, Schema } from "mongoose";

import { UserDB } from "../schemas";
import { PLACES_COLLECTION, USERS_COLLECTION } from "./base";

// Schema creation
const UserCollectionSchema = new Schema<UserDB>(
    {
        // Fields
        name: { type: String },
        email: { type: String },
        password: { type: String },
        imageUrl: { type: String },
        isAdmin: { type: Boolean },
        // Relations
        places: [
            {
                type: Schema.ObjectId,
                ref: PLACES_COLLECTION,
            },
        ],
    },
    { timestamps: true }
);
UserCollectionSchema.index({ createdAt: 1 });
UserCollectionSchema.index({ name: 1 }, { unique: true });
UserCollectionSchema.index({ email: 1 }, { unique: true });

// Hooks
UserCollectionSchema.pre("deleteOne", async function (next) {
    // Lazy loading to avoid circular imports
    const { PlaceModel } = await import("./place");
    const user = await this.model.findOne(this.getFilter());
    await PlaceModel.deleteMany({ creatorId: user.id });
    next();
});

// Model Creation
export const UserModel = model<UserDB>(USERS_COLLECTION, UserCollectionSchema);

export type UserDocument = InstanceType<typeof UserModel>;
