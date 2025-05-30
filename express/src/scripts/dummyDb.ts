import { NewUser, NewPlace } from "../schemas";

const getFullPath = (p: string): string => {
    return `src/data/${p}`;
};

export interface NewUserIn extends NewUser {
    _ref: number;
}

export const users: NewUserIn[] = [
    {
        _ref: 1,
        name: "Slim Beji",
        email: "mslimbeji@gmail.com",
        password: "very_secret",
        imageUrl: getFullPath("avatar1.jpg"),
        isAdmin: true,
    },
    {
        _ref: 2,
        name: "Mohamed Slim Beji",
        email: "beji.slim@yahoo.fr",
        password: "very_secret",
        imageUrl: getFullPath("avatar2.jpg"),
        isAdmin: false,
    },
];

export interface NewPlaceIn extends NewPlace {
    _ref: number;
    _createorRef: number;
}

export const places: NewPlaceIn[] = [
    {
        _ref: 1,
        _createorRef: 1,
        title: "Stamford Bridge",
        description: "Chelsea FC Stadium",
        imageUrl: getFullPath("place1.jpg"),
        address: "Fulham Road, London",
        location: { lat: 51.48180425016331, lng: -0.19090418688755467 },
    },
    {
        _ref: 2,
        _createorRef: 1,
        title: "Cobham Training Facility",
        description: "Chelsea training facility",
        imageUrl: getFullPath("place2.jpg"),
        address: "64 Stoke Rd, Stoke D'Abernon, Cobham KT11 3PT",
        location: { lat: 51.31735558375386, lng: -0.38584590510204153 },
    },
];
