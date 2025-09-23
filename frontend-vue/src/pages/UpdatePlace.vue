<template>
    <PlaceUpdateForm :place-id="placeId" />
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

import { PlaceUpdateForm } from "@/components/places";

// Init
const route = useRoute();
const placeId = route.params.placeId as string;
</script>
