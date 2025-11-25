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
import { computed, watch } from "vue";
import { useRoute } from "vue-router";

import { PlacesList } from "@/components/places";
import { HttpError, LoadingSpinner } from "@/components/ui";
import { useHttp } from "@/lib";
import { useAuthStore } from "@/store";
import type { Place } from "@/types";

// Init
const authStore = useAuthStore();
const route = useRoute();
const { httpData, sendRequest, clear } = useHttp({ ignoreNotFound: true });

// Computed
const userId = computed(() => route.params.userId as string | undefined);
const isUserOwned = computed(() => {
    return userId.value === authStore.userId;
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
    fetchPlaces(userId.value);
};

// Watchers
watch(userId, fetchPlaces, { immediate: true });
</script>
