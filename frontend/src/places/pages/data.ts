import { Place } from "../../shared/types";

export const DUMMY_PLACES: Place[] = [
    {
        id: 1,
        title: "Slim's House",
        description: "House of Slim",
        imageUrl:
            "https://img.delicious.com.au/DGZCHR1s/del/2018/12/paris-france-97370-2.jpg",
        address: "Somewhere",
        location: { lat: 51.505, lng: -0.09 },
        creatorId: 1,
    },
    {
        id: 2,
        title: "Slim's House 2",
        description: "Second House of Slim",
        imageUrl:
            "https://img.delicious.com.au/DGZCHR1s/del/2018/12/paris-france-97370-2.jpg",
        address: "Somewhere",
        location: { lat: 51.505, lng: -0.09 },
        creatorId: 2,
    },
];
