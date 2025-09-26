<template>
    <div class="avatar-container">
        <img :src="props.imageUrl" :alt="props.alt" />
    </div>
</template>

<script setup lang="ts">
// Props
const props = defineProps<{
    imageUrl: string;
    alt: string;
}>();
</script>

<style lang="css">
@reference "@/main.css";

.avatar-container {
    @apply w-16 h-16 overflow-hidden rounded-full;
    @apply flex justify-center items-center;
}

.avatar-container img {
    @apply w-full h-full object-cover;
}
</style>
