import { model, FilterQuery } from "mongoose";
import { v4 as uuid } from "uuid";
import { HttpStatus, ApiError } from "../framework";
import { Place, PlaceDBSchema, PlacePost, PlacePut } from "../schemas";

const PlaceDB = model<Place>("Place", PlaceDBSchema);

type PlaceDBType = InstanceType<typeof PlaceDB>;

export class CrudPlace {
    constructor(public model = PlaceDB, public collection: string = "place") {}

    public hideSecrets = (place: Place): Place => {
        return place;
    };

    public toJson = (rawPlaces: PlaceDBType[]): Place[] => {
        return rawPlaces.map((el) => {
            return this.hideSecrets(
                el.toObject({
                    getters: true,
                    transform: (doc, ret) => {
                        delete ret._id;
                        delete ret.__v;
                        return ret;
                    },
                })
            );
        });
    };

    private getById = async (id: string): Promise<PlaceDBType> => {
        const rawPlace = await this.model.findById(id);
        if (!rawPlace) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No place found with id ${id}`
            );
        }
        return rawPlace;
    };

    public get = async (id: string): Promise<Place> => {
        const rawPlace = await this.getById(id);
        return this.toJson([rawPlace])[0];
    };

    public search = async (query: FilterQuery<Place>): Promise<Place[]> => {
        const rawPlaces = await this.model.find(query);
        if (!rawPlaces.length) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No places found with query ${query}!`
            );
        }
        return this.toJson(rawPlaces);
    };

    public create = async (form: PlacePost): Promise<Place> => {
        const newPlace = new this.model({
            creatorId: uuid(),
            ...form,
        });
        await newPlace.save();
        return this.toJson([newPlace])[0];
    };

    public update = async (id: string, form: PlacePut): Promise<Place> => {
        const rawPlace = await this.getById(id);
        rawPlace.set(form);
        await rawPlace.save();
        return this.toJson([rawPlace])[0];
    };

    public delete = async (id: string): Promise<void> => {
        const rawPlace = await this.getById(id);
        await rawPlace.deleteOne();
    };
}

export const crudPlace = new CrudPlace();
