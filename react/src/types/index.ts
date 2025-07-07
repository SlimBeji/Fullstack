import { FormEvent } from "react";

export type HttpMethods = "get" | "post" | "put" | "delete";

export type HeaderContent = "application/json" | "multipart/form-data";

export type ButtonType = "button" | "submit" | "reset" | undefined;

export type FormSubmitHandler = (e: FormEvent) => void;

export interface EncodedUserToken {
    userId: string;
    email: string;
    token: string;
    expiresAt: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
    imageUrl?: string;
    places: string[];
}

export interface Location {
    lat: number;
    lng: number;
}

export interface Place {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    address: string;
    location: Location;
    creatorId: string;
}

export enum LocalStorageKeys {
    userData = "userData",
}
