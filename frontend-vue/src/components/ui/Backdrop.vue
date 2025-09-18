<template>
    <teleport to="#backdrop-hook">
        <div class="modal-backdrop" @click="close"></div>
    </teleport>
</template>

<script setup lang="ts">
// Props definition
defineProps<{
    close: () => void;
}>();
</script>

<style lang="css">
@reference "../../main.css";
@layer components {
    .modal-backdrop {
        @apply fixed top-0 left-0 w-full h-screen bg-backdrop opacity-70 z-10;
    }
}
</style>
