<template>
    <Teleport to="#modal-hook">
        <Backdrop v-if="props.show" :close="props.onCancel" />
        <Transition name="modal-transition" appear>
            <div v-if="props.show" class="modal-container" :style="style">
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
import { computed, CSSProperties } from "vue";

import { Backdrop } from "@/components/ui";
import { FormSubmitHandler } from "@/types";

// Props definition
const props = defineProps<{
    show: boolean;
    header: string;
    onSubmit?: FormSubmitHandler;
    style?: CSSProperties;
    onCancel: () => void;
}>();

// Computed
const submitHanlder = computed(() => {
    if (props.onSubmit) {
        return props.onSubmit;
    } else {
        return (e: Event) => e.preventDefault();
    }
});
</script>

<style lang="css">
@reference "../../main.css";

@layer components {
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
}
</style>
