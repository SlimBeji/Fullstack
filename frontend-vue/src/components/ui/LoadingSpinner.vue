<template>
    <div class="spinner-container" :class="{ overlay: props.asOverlay }">
        <div></div>
    </div>
</template>

<script setup lang="ts">
// Props definition
const props = defineProps<{
    asOverlay?: boolean;
}>();
</script>

<style lang="css">
@reference "../../main.css";
@layer components {
    .spinner-container.overlay {
        @apply absolute inset-0 bg-surface/90 flex justify-center items-center;
    }

    .spinner-container > div {
        @apply w-12 h-12 rounded-full animate-spin;
        @apply border-4 border-secondary border-t-transparent;
    }
}
</style>
