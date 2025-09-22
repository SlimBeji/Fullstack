<template>
    <div class="input-container" :class="[customClass, { error: showError }]">
        <label :for="props.id">{{ props.label }}</label>
        <component
            v-model="value"
            @input="$emit('update:modelValue', $event.target.value)"
            @blur="inputTouched"
            :value="value"
            :is="tagConfig.tag"
            :id="props.id"
            :class="inputClass"
            v-bind="tagConfig.tagProps"
        />
        <p class="error-text" :class="{ invisible: !showError }">
            {{ props.errorText || "The input is not valid" }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { CssClass } from "@/types";

// Props
const value = defineModel<string>({ required: true });

const props = defineProps<{
    id: string;
    label: string;
    isValid?: boolean;
    class?: CssClass;
    element?: "input" | "textarea";
    type?: HTMLInputElement["type"];
    disabled?: boolean;
    rows?: number;
    placeholder?: string;
    errorText?: string;
}>();

// State
const isTouched = ref<boolean>(false);

// Computed
const customClass = computed(() => {
    if (!props.class) {
        return "basis-full";
    }
    return props.class;
});

const inputClass = computed(() => ({
    disabled: props.disabled,
    active: !props.disabled,
}));

const showError = computed(() => !props.isValid && isTouched.value);

const tagConfig = computed(() => {
    let tag = "input";
    const tagProps: Record<string, any> = { disabled: props.disabled ?? false };
    switch (props.element) {
        case "textarea":
            tag = "textarea";
            tagProps.rows = props.rows || 3;
            break;
        case "input":
        default:
            tagProps.type = props.type;
            tagProps.placeholder = props.placeholder;
            break;
    }
    return { tag, tagProps };
});

// Handlers
const inputTouched = () => {
    if (!props.disabled) isTouched.value = true;
};
</script>

<style lang="css">
@reference "../../main.css";

@layer components {
    .input-container {
        @apply mb-4;
    }

    .input-container label {
        @apply block mb-2 font-semibold text-pen error:text-danger;
    }

    .input-container textarea,
    .input-container input {
        @apply w-full rounded-md border px-3 py-2;
    }

    .input-container textarea.active,
    .input-container input.active {
        @apply text-pen border-pen-ruler bg-surface-alt;
        @apply focus:border-secondary focus:outline-none;
        @apply error:bg-danger-surface error:border-danger;
    }

    .input-container .error-text {
        @apply mt-1 text-sm text-danger;
    }
}
</style>
