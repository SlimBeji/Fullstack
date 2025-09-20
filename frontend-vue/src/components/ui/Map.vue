<template>
    <div class="map-container">
        <LMap
            :zoom="mapZoom"
            :center="[props.position.lat, props.position.lng]"
            :scroll-wheel-zoom="false"
            ref="map"
            class="w-full h-full"
            @ready="mapReadyHandler"
        >
            <LTileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LMarker :lat-lng="props.position">
                <LPopup>{{ props.markerText }}</LPopup>
            </LMarker>
        </LMap>
    </div>
</template>

<script setup lang="ts">
import { LMap, LMarker, LPopup, LTileLayer } from "@vue-leaflet/vue-leaflet";
import { Map as LeafletMap } from "leaflet";
import { ref } from "vue";

import { Location } from "@/types";

// Props
const props = defineProps<{
    position: Location;
    zoom: number;
    markerText: string;
}>();

// State
const map = ref<LeafletMap | null>(null);
const mapZoom = ref<number>(props.zoom);

// Handlers
const mapReadyHandler = (mapInstance: LeafletMap) => {
    map.value = mapInstance;
    map.value.invalidateSize();
};
</script>

<style lang="css">
@reference "../../main.css";

@layer components {
    .map-container {
        @apply w-full h-50;
    }
}
</style>
