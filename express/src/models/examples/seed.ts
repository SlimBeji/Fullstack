import { NewUserIn, users } from "./users";
import { NewPlaceIn, places } from "./places";
import { crudUser, crudPlace } from "../crud";
import { uploadLocal } from "../../lib/utils";

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

export const seedDb = async (): Promise<void> => {
    await seedUsers(users);
    await seedPlaces(places);
};
