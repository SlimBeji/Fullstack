import { v4 as uuid } from "uuid";
import { HttpStatus, ApiError } from "../framework";
import { Place, PlacePost, PlacePut } from "../schemas";

export class CrudPlace {
    constructor(public collection: string = "place") {}
    public hidePlaceSecrets = (places: Place[]): Place[] => {
        return places;
    };
    public placeLookup = <K extends keyof Place>(
        identifier: Place[K],
        fieldName: K = "id" as K
    ): Place[] => {
        let places: Place[];
        if (identifier === "*") {
            places = DUMMY_PLACES;
        } else {
            places = DUMMY_PLACES.filter((el) => {
                return el[fieldName] === identifier;
            });
        }

        if (!places.length) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No places with field ${fieldName} equal to ${identifier}!`
            );
        }
        return this.hidePlaceSecrets(places);
    };
    public createPlace = (form: PlacePost): Place => {
        const newPlace: Place = {
            id: uuid(),
            creatorId: uuid(),
            ...form,
        };
        DUMMY_PLACES.push(newPlace);
        return this.hidePlaceSecrets([newPlace])[0];
    };

    public updatePlace = <K extends keyof Place>(
        identifier: Place[K],
        form: PlacePut,
        fieldName: K = "id" as K
    ): Place => {
        const place = this.placeLookup(identifier, fieldName)[0];
        const placeIndex = DUMMY_PLACES.findIndex((el) => el.id === place.id);
        const updatedPlace = { ...DUMMY_PLACES[placeIndex], ...form };
        DUMMY_PLACES[placeIndex] = updatedPlace;
        return this.hidePlaceSecrets([updatedPlace])[0];
    };

    public deletePlace = <K extends keyof Place>(
        identifier: Place[K],
        fieldName: K = "id" as K
    ): void => {
        const place = this.placeLookup(identifier, fieldName)[0];
        const placeIndex = DUMMY_PLACES.findIndex((el) => el.id === place.id);
        DUMMY_PLACES.splice(placeIndex, 1);
    };
}

export const crudPlace = new CrudPlace();

export const DUMMY_PLACES: Place[] = [
    {
        id: "f9e358b8-7af2-49fc-89c0-5e562bdeed26",
        title: "Slim's House",
        description: "House of Slim",
        imageUrl:
            "https://img.delicious.com.au/DGZCHR1s/del/2018/12/paris-france-97370-2.jpg",
        address: "Somewhere",
        location: { lat: 51.505, lng: -0.09 },
        creatorId: "12afa5af-f632-42bf-875a-c91038614dba",
    },
    {
        id: "cc48df98-3e61-4e83-8e8f-814ac03b71b3",
        title: "Slim's House 2",
        description: "Second House of Slim",
        imageUrl:
            "https://img.delicious.com.au/DGZCHR1s/del/2018/12/paris-france-97370-2.jpg",
        address: "Somewhere",
        location: { lat: 51.505, lng: -0.09 },
        creatorId: "25163b14-4da1-41ef-a4c1-830b3e09f4d3",
    },
];
