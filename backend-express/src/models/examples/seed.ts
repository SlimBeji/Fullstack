import { pgClient, redisClient, storage } from "@/services/instances";

import { crudsPlace, crudsUser } from "../cruds";
import { Tables } from "../orm";
import { PlaceSeed, UserSeed } from "../schemas";
import { places } from "./places";
import { users } from "./users";

const userRefMapping: Map<number, number> = new Map();
const placeRefMapping: Map<number, number> = new Map();

const seedUsers = async (raw: UserSeed[]): Promise<void> => {
    await Promise.all(
        raw.map(async (newUserIn) => {
            newUserIn.imageUrl = await storage.uploadFile(newUserIn.imageUrl!);
            const { _ref, ...form } = newUserIn;
            const user = await crudsUser.create(form);
            userRefMapping.set(newUserIn._ref, user.id);
        })
    );
};

const seedPlaces = async (raw: PlaceSeed[]): Promise<void> => {
    await Promise.all(
        raw.map(async (newPlaceIn) => {
            newPlaceIn.imageUrl = await storage.uploadFile(
                newPlaceIn.imageUrl!
            );
            const { _ref, _createorRef, embedding, ...form } = newPlaceIn;
            const data = {
                ...form,
                creatorId: userRefMapping.get(_createorRef)!,
            };
            const place = await crudsPlace.seed(data, embedding!);
            placeRefMapping.set(newPlaceIn._ref, place.id);
        })
    );
};

export const seedDb = async (verbose: boolean = false): Promise<void> => {
    await seedUsers(users);
    if (verbose) console.log("✅ Table User seeded!");
    await seedPlaces(places);
    if (verbose) console.log("✅ Table Place seeded!");
    if (verbose) console.log("✅ Finished. You may exit");
};

export const dumpDb = async (verbose: boolean = false): Promise<void> => {
    for (const tablename of Object.values(Tables)) {
        await pgClient.resetTable(tablename);
    }
    if (verbose) console.log("✅ All Tables reset");
    await redisClient.flushAll();
    if (verbose) console.log("✅ Cache DB flushed");
    if (verbose) console.log("✅ Finished. You may exit");
};
