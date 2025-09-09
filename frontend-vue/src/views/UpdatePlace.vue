<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();
const placeId = route.params.placeId as string;
</script>

<template>
    <div>
        <h1>
            This is the page where the owner of place {{ placeId }} edits the
            place informations
        </h1>
    </div>
</template>
