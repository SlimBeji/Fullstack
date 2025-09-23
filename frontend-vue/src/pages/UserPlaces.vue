<template>
    <HttpError
        v-if="httpData.error?.message"
        @close="clear"
        :error="httpData.error"
    />
    <LoadingSpinner v-if="httpData.loading" as-overlay />
    <PlacesList
        @delete="deleteHandler"
        :items="places"
        :same-authenticated-user="isUserOwned"
    />
</template>

<script setup lang="ts">
import { HttpStatusCode } from "axios";
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";

import { PlacesList } from "@/components/places";
import { HttpError, LoadingSpinner } from "@/components/ui";
import { useHttp } from "@/lib";
import { useAuthStore } from "@/stores";
import { Place } from "@/types";

// Init
const authStore = useAuthStore();
const route = useRoute();
const userId = route.params.userId as string;
const { httpData, sendRequest, clear } = useHttp({ ignoreNotFound: true });

// Events
onMounted(() => {
    fetchPlaces(userId);
});

// Computed
const isUserOwned = computed(() => {
    return userId === authStore.userId;
});

const places = computed(() => {
    let result = (httpData.value.json?.data as Place[]) || [];
    if (httpData.value.statusCode === HttpStatusCode.NotFound) result = [];
    return result;
});

// Handlers
const fetchPlaces = (userId: string | undefined) => {
    if (!userId) return;
    sendRequest(`/places/?creatorId=${userId}`, "get").catch((err) =>
        console.log(err)
    );
};

const deleteHandler = async () => {
    fetchPlaces(userId);
};
</script>
