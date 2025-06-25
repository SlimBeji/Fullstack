import { model, Schema } from "mongoose";
import { PlaceDB } from "../schemas";
import { CollectionEnum, HttpStatus, ApiError } from "../../types";
import { UserModel } from "./user";

// Schema creation
export const PlaceCollectionSchema = new Schema<PlaceDB>(
    {
        // Fields
        title: { type: String, required: true },
        description: { type: String, required: true, min: 10 },
        imageUrl: { type: String, required: false },
        address: { type: String, required: true, min: 1 },
        location: {
            required: false,
            _id: false,
            type: {
                lat: { type: Number, required: true },
                lng: { type: Number, required: true },
            },
        },
        // Foreign Keys:
        creatorId: {
            type: Schema.ObjectId,
            required: true,
            ref: CollectionEnum.USERS,
        },
        // AI
        embedding: {
            type: [Number],
            required: false,
            validate: [
                (arr: number[]) => arr.length === 384,
                "{PATH} must have exactly 384 elements",
            ],
        },
    },
    { timestamps: true }
);
PlaceCollectionSchema.index({ createdAt: 1 });

// Hooks
PlaceCollectionSchema.pre("save", async function (next) {
    const userExists = await UserModel.exists({ _id: this.creatorId });
    if (!userExists)
        throw new ApiError(HttpStatus.BAD_REQUEST, "User does not exist");
    next();
});

PlaceCollectionSchema.post("save", async function (place, next) {
    await UserModel.findByIdAndUpdate(place.creatorId, {
        $push: { places: place._id },
    });
    next();
});

PlaceCollectionSchema.pre("deleteOne", async function (next) {
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
