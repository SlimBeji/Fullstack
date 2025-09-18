<template>
    <Teleport to="#drawer-hook">
        <Transition name="sidedrawer-transition" appear>
            <aside v-if="show" class="sidedrawer" @click="onClick">
                <slot />
            </aside>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
// Props
defineProps<{
    show: boolean;
    onClick: () => void;
}>();
</script>

<style lang="css">
@reference "../../main.css";

@layer components {
    aside.sidedrawer {
        @apply fixed z-40 top-0 left-0 h-screen w-[70%];
        @apply bg-surface shadow-md;
    }

    .sidedrawer-transition-enter-active,
    .sidedrawer-transition-leave-active {
        @apply transform transition duration-200;
    }

    .sidedrawer-transition-enter-from,
    .sidedrawer-transition-leave-to {
        @apply -translate-x-full opacity-0;
    }

    .sidedrawer-transition-enter-to,
    .sidedrawer-transition-leave-from {
        @apply -translate-x-0 opacity-100;
    }
}
</style>
