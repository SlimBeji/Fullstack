<template>
    <div class="input-container" :class="[widthClass, { error: isError }]">
        <label :for="props.id">{{ props.label }}</label>
        <component
            :is="tagConfig.tag"
            :id="props.id"
            :class="inputClass"
            v-bind="tagConfig.tagProps"
            @blur="inputTouched"
            @input="valueChanged"
        />
        <p class="error-text" :class="{ invisible: !isError }">
            {{ props.errorText || "The input is not valid" }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { validate, ValidatorType } from "@/lib";

// Props definition
const props = defineProps<{
    element?: "input" | "textarea";
    type?: HTMLInputElement["type"];
    id: string;
    label: string;
    disabled?: boolean;
    onInput: (value: string, isValid: boolean) => void;
    width?: string;
    padding?: string;
    rows?: number;
    placeholder?: string;
    validators?: ValidatorType[];
    errorText?: string;
    value?: string;
    isValid?: boolean;
}>();

// State definition
const data = ref<string>(props.value || "");
const isValid = ref<boolean>(props.isValid || false);
const isTouched = ref<boolean>(false);

// Computed
const widthClass = computed(() => {
    if (props.width) {
        return `basis-${props.width} ${props.padding ?? ""}`;
    } else {
        return "basis-full";
    }
});

const inputClass = computed(() => ({
    disabled: props.disabled,
    active: !props.disabled,
}));

const isError = computed(() => !isValid.value && isTouched.value);

const tagConfig = computed(() => {
    let tag = "input";
    const tagProps: Record<string, any> = {};
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
const emitUpdate = () => {
    props.onInput(data.value, isValid.value);
};

const inputTouched = () => {
    if (!props.disabled) isTouched.value = true;
};

const valueChanged = (event: Event) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    data.value = target.value;
    const valid = props.validators
        ? validate(data.value, props.validators)
        : true;
    isValid.value = valid;
    emitUpdate();
};

// Events
onMounted(() => {
    // Emit an update on compount mounting in case the Image
    // is required and no value provided initially
    emitUpdate();
});
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
