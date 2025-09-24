<template>
    <ul class="places-list">
        <template v-if="props.items.length > 0">
            <PlaceItem
                v-for="place in props.items"
                @delete="emit('delete')"
                :key="place.id"
                :place="place"
            />
        </template>
        <div v-else-if="props.sameAuthenticatedUser" class="no-places">
            <div class="card">
                <h2>No places found. Maybe create one?</h2>
                <Button color="secondary" to="/places/new"> Share </Button>
            </div>
        </div>
        <div v-else class="no-places">
            <div class="card">
                <h2>This user has not created places yet</h2>
            </div>
        </div>
    </ul>
</template>

<script setup lang="ts">
import { Button } from "@/components/form";
import type { Place } from "@/types";

import PlaceItem from "./PlaceItem.vue";

// Props
const props = defineProps<{
    sameAuthenticatedUser?: boolean;
    items: Place[];
}>();

// Events
const emit = defineEmits<{
    (e: "delete"): void;
}>();
</script>

<style lang="css">
@reference "../../main.css";

@layer components {
    .places-list {
        @apply w-[90%] max-w-[40rem] my-4 mx-auto p-0 list-none;
    }

    .no-places {
        @apply mx-auto w-100 max-w-[90%];
    }

    .no-places .card {
        @apply p-5 text-center;
    }

    .no-places .card h2 {
        @apply my-5;
    }
}
</style>
