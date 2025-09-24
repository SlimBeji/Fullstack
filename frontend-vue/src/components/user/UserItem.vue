<template>
    <li class="user-item">
        <div class="card">
            <RouterLink :to="`/${props.user.id}/places`" class="user-item-link">
                <div class="user-avatar">
                    <Avatar :imageUrl="imageUrl" :alt="props.user.name" />
                </div>
                <div class="user-info">
                    <h2>{{ user.name }}</h2>
                    <h3>{{ placeNumber }}</h3>
                </div>
            </RouterLink>
        </div>
    </li>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

import placeholder from "@/assets/avatar_placeholder.jpg";
import { Avatar } from "@/components/ui";
import type { User } from "@/types";

// Props
const props = defineProps<{
    user: User;
}>();

// Computed
const imageUrl = computed(() => props.user.imageUrl || placeholder);

const placeNumber = computed(() => {
    const number = props.user.places.length;
    if (number > 1) {
        return `${number} Places`;
    }
    return `${number} Place`;
});
</script>

<style lang="css">
@reference "../../main.css";

@layer components {
    .user-item {
        @apply w-[45%] min-w-[17.5rem] m-4;
    }

    .user-item .card {
        @apply p-0 rounded-xl;
        @apply hover:shadow-lg transition-shadow duration-300;
    }

    .user-item-link {
        @apply flex items-center;
        @apply size-full p-4 rounded-xl bg-surface-alt;
        @apply hover:bg-surface-on transition-colors duration-200;
    }

    .user-item .user-avatar {
        @apply w-16 h-16 mr-4;
    }

    .user-item .user-info h2 {
        @apply text-lg font-semibold text-pen;
    }

    .user-item .user-info h3 {
        @apply text-sm text-pen-muted;
    }
}
</style>
