<template>
    <HttpError
        v-if="httpData.error?.message"
        @close="clear"
        :error="httpData.error"
        header="Could not fetch users!"
    />
    <LoadingSpinner v-if="httpData.loading" as-overlay />
    <UsersList v-if="httpData.json?.data" :items="items" />
</template>

<script setup lang="ts">
import { computed } from "vue";

import { HttpError, LoadingSpinner } from "@/components/ui";
import { UsersList } from "@/components/user";
import { useHttp } from "@/lib";
import type { User } from "@/types";

// Init
const { httpData, sendRequest, clear } = useHttp();
sendRequest("/users/", "get");

// Computed
const items = computed((): User[] => {
    if (httpData.value.json?.data) {
        return httpData.value.json?.data as User[];
    }
    return [];
});
</script>
