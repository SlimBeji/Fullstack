<template>
    <Teleport to="#modal-hook">
        <Backdrop v-if="props.show" @click="emit('close')" />
        <Transition name="modal-transition" appear>
            <div v-if="props.show" :style="style" class="modal-container">
                <header>
                    <h2>{{ props.header }}</h2>
                </header>
                <form @submit="submitHanlder">
                    <slot></slot>
                    <footer><slot name="footer"></slot></footer>
                </form>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";

import { Backdrop } from "@/components/ui";

// Props
const props = defineProps<{
    show: boolean;
    header: string;
    style?: CSSProperties;
}>();

// Events
const emit = defineEmits<{
    (e: "close"): void;
    (e: "submit", event: Event): void;
}>();

// Handlers
const submitHanlder = (e: Event) => {
    e.preventDefault();
    emit("submit", e);
};
</script>

<style lang="css">
@reference "@/main.css";

.modal-container {
    @apply fixed z-50 top-[22vh] left-[10%];
    @apply w-[80%] rounded-lg shadow-lg bg-surface;
    @apply md:left-1/2 md:w-160 md:-translate-x-1/2;
    @apply lg:w-200;
}

.modal-container header {
    @apply w-full rounded-t-lg p-4 bg-secondary text-pen-inverse;
}

.modal-container header h2 {
    @apply m-2 text-xl font-semibold;
}

.modal-container form > div {
    @apply p-4 min-h-30;
}

.modal-container form > footer {
    @apply flex justify-end space-x-2 p-4;
}

.modal-transition-enter-active,
.modal-transition-leave-active {
    @apply transform transition-all duration-300 ease-out;
}

.modal-transition-enter-from,
.modal-transition-leave-to {
    @apply -translate-y-20 opacity-0;
}

.modal-transition-enter-to,
.modal-transition-leave-from {
    @apply -translate-y-0 opacity-100;
}
</style>
