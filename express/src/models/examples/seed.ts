import mongoose, { Types } from "mongoose";
import { NewUserIn, users } from "./users";
import { NewPlaceIn, places } from "./places";
import { crudUser, crudPlace } from "../crud";
import { uploadLocal } from "../../lib/utils";
import { CollectionEnum } from "../../types";

const userRefMapping: Map<number, Types.ObjectId> = new Map();
const placeRefMapping: Map<number, Types.ObjectId> = new Map();

const createCollections = async (): Promise<void> => {
    await Promise.all(
        Object.values(CollectionEnum).map(async (collectionName: string) => {
            await mongoose.connection.db!.createCollection(collectionName);
        })
    );
};

const seedUsers = async (raw: NewUserIn[]): Promise<void> => {
    await Promise.all(
        raw.map(async (newUserIn) => {
            newUserIn.imageUrl = await uploadLocal(newUserIn.imageUrl!);
            const user = await crudUser.create(newUserIn);
            userRefMapping.set(newUserIn._ref, user.id);
        })
    );
};

const seedPlaces = async (raw: NewPlaceIn[]): Promise<void> => {
    await Promise.all(
        raw.map(async (newPlaceIn) => {
            newPlaceIn.imageUrl = await uploadLocal(newPlaceIn.imageUrl!);
            const data = {
                ...newPlaceIn,
                creatorId: userRefMapping.get(newPlaceIn._createorRef)!,
            };
            const place = await crudPlace.create(data);
            placeRefMapping.set(newPlaceIn._ref, place.id);
        })
    );
};

export const seedDb = async (): Promise<void> => {
    await createCollections();
    await seedUsers(users);
    await seedPlaces(places);
};

export const dumpDb = async (): Promise<void> => {
    const collections = await mongoose.connection.db!.collections();
    for (const collection of collections) {
        await collection.deleteMany({});
        console.log(`✅ Collection ${collection.namespace} cleared!`);
    }
};
