import { PlaceSeed } from "../schemas";
import { getImagePath } from "../../lib/utils";

export const places: PlaceSeed[] = [
    {
        _ref: 1,
        _createorRef: 1,
        title: "Stamford Bridge",
        description: "Chelsea FC Stadium",
        imageUrl: getImagePath("place1.jpg"),
        address: "Fulham Road, London",
        location: { lat: 51.48180425016331, lng: -0.19090418688755467 },
    },
    {
        _ref: 2,
        _createorRef: 1,
        title: "Cobham Training Facility",
        description: "Chelsea training facility",
        imageUrl: getImagePath("place2.jpg"),
        address: "64 Stoke Rd, Stoke D'Abernon, Cobham KT11 3PT",
        location: { lat: 51.31735558375386, lng: -0.38584590510204153 },
    },
];
