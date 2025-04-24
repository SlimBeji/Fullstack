import { FormEvent } from "react";

export type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

export type HttpMethods = "get" | "post" | "put" | "delete";

export type ButtonType = "button" | "submit" | "reset" | undefined;

export type FormSubmitHandler = (e: FormEvent) => void;

export interface Location {
    lat: number;
    lng: number;
}

export interface User {
    id: number;
    name: string;
    imageUrl?: string;
    places: string[];
}

export interface Place {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    address: string;
    location: Location;
    creatorId: string;
}
