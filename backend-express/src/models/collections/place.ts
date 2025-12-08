import { model, Schema } from "mongoose";

import { HttpStatus } from "@/lib/express";
import { ApiError, CollectionEnum } from "@/types";

import { PlaceDB } from "../schemas";

// Schema creation
export const PlaceCollectionSchema = new Schema<PlaceDB>(
    {
        // Fields
        title: { type: String },
        description: { type: String },
        imageUrl: { type: String },
        address: { type: String },
        location: {
            _id: false,
            type: {
                lat: { type: Number },
                lng: { type: Number },
            },
        },
        // AI
        embedding: { type: [Number] },
        // Foreign Keys:
        creatorId: {
            type: Schema.ObjectId,
            ref: CollectionEnum.USERS,
        },
    },
    { timestamps: true }
);
PlaceCollectionSchema.index({ createdAt: 1 });

// Hooks
PlaceCollectionSchema.pre("save", async function (next) {
    // Lazy loading to avoid circular imports
    const { UserModel } = await import("./user");
    const userExists = await UserModel.exists({ _id: this.creatorId });
    if (!userExists)
        throw new ApiError(HttpStatus.BAD_REQUEST, "User does not exist");
    next();
});

PlaceCollectionSchema.post("save", async function (place, next) {
    // Lazy loading to avoid circular imports
    const { UserModel } = await import("./user");
    await UserModel.findByIdAndUpdate(place.creatorId, {
        $addToSet: { places: place._id },
    });
    next();
});

PlaceCollectionSchema.pre("deleteOne", async function (next) {
    // Lazy loading to avoid circular imports
    const { UserModel } = await import("./user");
    const place = await this.model.findOne(this.getFilter());
    await UserModel.findByIdAndUpdate(place.creatorId, {
        $pull: { places: place._id },
    });
    next();
});

// Model Creation
export const PlaceModel = model<PlaceDB>(
    CollectionEnum.PLACES,
    PlaceCollectionSchema
);

export type PlaceDocument = InstanceType<typeof PlaceModel>;
