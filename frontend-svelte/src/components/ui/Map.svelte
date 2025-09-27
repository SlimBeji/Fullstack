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
const props = $props<{
    position: Location;
    zoom: number;
    markerText: string;
}>();

// State
let mapZoom = $state(props.zoom);

// Events
onMount(() => {
    map = L.map(mapDiv).setView(
        [props.position.lat, props.position.lng],
        mapZoom
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    marker = L.marker([props.position.lat, props.position.lng])
        .addTo(map)
        .bindPopup(props.markerText);

    map.invalidateSize();
    return () => map.remove();
});

// Effects
$effect(() => {
    if (map && marker) {
        marker.setLatLng([props.position.lat, props.position.lng]);
        map.setView([props.position.lat, props.position.lng], mapZoom);
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
