<script lang="ts">
import type { Map as LeafletMap, Marker } from "leaflet";
import * as L from "leaflet";
import { onMount } from "svelte";

import type { Location } from "@/types";

// Init
let mapDiv: HTMLDivElement;
let map: LeafletMap;
let marker: Marker;

// Props
const {position, zoom, markerText} = $props<{
    position: Location;
    zoom: number;
    markerText: string;
}>();

// Events
onMount(() => {
    map = L.map(mapDiv).setView(
        [position.lat, position.lng],
        zoom
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    marker = L.marker([position.lat, position.lng])
        .addTo(map)
        .bindPopup(markerText);

    map.invalidateSize();
    return () => map.remove();
});

// Effects
$effect(() => {
    if (map && marker) {
        marker.setLatLng([position.lat, position.lng]);
        map.setView([position.lat, position.lng], zoom);
    }
});
</script>

<div bind:this={mapDiv} class="map-container"></div>

<style lang="css">
@reference "@/main.css";

.map-container {
    @apply w-full h-50;
}
</style>
