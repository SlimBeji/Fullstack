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
