import "leaflet/dist/leaflet.css";
import "./Map.css";

import { Map as MapObject } from "leaflet";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { Location } from "../../types";

interface MapProps {
    position: Location;
    zoom: number;
    className?: string;
    markerText: string;
}

const Map: React.FC<MapProps> = ({ position, zoom, className, markerText }) => {
    const [map, setMap] = useState<MapObject | null>(null);

    useEffect(() => {
        if (map) {
            map.invalidateSize();
        }
    }, [map]);

    return (
        <div className="map-wrapper">
            <MapContainer
                center={position}
                zoom={zoom}
                scrollWheelZoom={false}
                className={`leaflet-map ${className}`}
                whenReady={() => setMap}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    <Popup>{markerText}</Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default Map;
