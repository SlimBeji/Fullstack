import mongoose, { Types } from "mongoose";
import { users } from "./users";
import { places } from "./places";
import { crudUser, crudPlace } from "../crud";
import { uploadLocal } from "../../lib/clients";
import { CollectionEnum } from "../../types";
import { UserSeed, PlaceSeed } from "../schemas";

const userRefMapping: Map<number, Types.ObjectId> = new Map();
const placeRefMapping: Map<number, Types.ObjectId> = new Map();

const createCollections = async (): Promise<void> => {
    await Promise.all(
        Object.values(CollectionEnum).map(async (collectionName: string) => {
            await mongoose.connection.db!.createCollection(collectionName);
        })
    );
};

const seedUsers = async (raw: UserSeed[]): Promise<void> => {
    await Promise.all(
        raw.map(async (newUserIn) => {
            newUserIn.imageUrl = await uploadLocal(newUserIn.imageUrl!);
            const user = await crudUser.createDocument(newUserIn);
            userRefMapping.set(newUserIn._ref, user.id);
        })
    );
};

const seedPlaces = async (raw: PlaceSeed[]): Promise<void> => {
    await Promise.all(
        raw.map(async (newPlaceIn) => {
            newPlaceIn.imageUrl = await uploadLocal(newPlaceIn.imageUrl!);
            const data = {
                ...newPlaceIn,
                creatorId: userRefMapping.get(newPlaceIn._createorRef)!,
            };
            const place = await crudPlace.createDocument(data);
            placeRefMapping.set(newPlaceIn._ref, place.id);
        })
    );
};

export const seedDb = async (verbose: boolean = false): Promise<void> => {
    await createCollections();
    await seedUsers(users);
    if (verbose) console.log("✅ Collection User seeded!");
    await seedPlaces(places);
    if (verbose) console.log("✅ Collection Place seeded!");
    if (verbose) console.log("✅ Finished. You may exit");
};

export const dumpDb = async (verbose: boolean = false): Promise<void> => {
    const collections = await mongoose.connection.db!.collections();
    for (const collection of collections) {
        await collection.deleteMany({});
        if (verbose) {
            console.log(`✅ Collection ${collection.namespace} cleared!`);
        }
    }
    if (verbose) console.log("✅ Finished. You may exit");
};
