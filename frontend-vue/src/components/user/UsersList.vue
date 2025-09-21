<template>
    <div v-if="noUsers" class="no-users">
        <div class="card">
            <h2>No Users found!</h2>
        </div>
    </div>
    <ul v-else class="users-list">
        <UserItem v-for="item in props.items" :key="item.id" :user="item" />
    </ul>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { User } from "@/types";

import { UserItem } from "./";

// Props
const props = defineProps<{
    items: User[];
}>();

// Computed
const noUsers = computed(() => props.items.length === 0);
</script>

<style lang="css">
@reference "../../main.css";

@layer components {
    .users-list {
        @apply flex flex-wrap gap-6;
        @apply w-[90%] max-w-4xl mx-auto;
    }

    .no-users {
        @apply flex justify-center items-center;
    }

    .no-users h2 {
        @apply text-xl font-semibold text-pen;
    }
}
</style>
