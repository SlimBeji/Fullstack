import { parseDotNotation } from "@/lib/utils";

describe("parseDotNotation helper method", () => {
    it("converts flat json with keys using dot notation to a nested object", () => {
        const example = {
            address: "Fulham Road, London",
            "location.lat": 51.48180425016331,
            "location.lng": -0.19090418688755467,
        };
        const expected = {
            address: "Fulham Road, London",
            location: { lat: 51.48180425016331, lng: -0.19090418688755467 },
        };
        expect(parseDotNotation(example)).toEqual(expected);
    });
});
