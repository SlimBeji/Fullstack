import { FormEvent } from "react";

export type HttpMethods = "get" | "post" | "put" | "delete";

export type HeaderContent = "application/json" | "multipart/form-data";

export type ButtonType = "button" | "submit" | "reset" | undefined;

export type FormSubmitHandler = (e: FormEvent) => void;

export interface SigninResponse {
    access_token: string;
    token_type: "bearer";
    userId: string;
    email: string;
    expires_in: number;
}

export interface EncodedUserToken {
    access_token: string;
    token_type: "bearer";
    userId: string;
    email: string;
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
