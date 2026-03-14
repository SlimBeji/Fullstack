export interface User {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    image_url?: string;
    places: string[];
    created_at: string;
}

export interface Location {
    lat: number;
    lng: number;
}

export interface Place {
    id: string;
    title: string;
    description: string;
    image_url?: string;
    address: string;
    location: Location;
    creator_id: number;
    created_at: string;
}
