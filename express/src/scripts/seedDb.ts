import mongoose from "mongoose";
import config from "../config";
import { NewPlaceIn, NewUserIn, places, users } from "./dummyDb";
import { crudPlace, crudUser } from "../crud";
import { uploadLocal } from "../utils";

const userRefMapping: Map<number, string> = new Map();
const placeRefMapping: Map<number, string> = new Map();

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

const seedDb = async (): Promise<void> => {
    await seedUsers(users);
    await seedPlaces(places);
};

mongoose
    .connect(config.MONGO_URL)
    .then(() => seedDb())
    .then(() => console.log("Finished Creating database"))
    .finally(() => mongoose.disconnect());
