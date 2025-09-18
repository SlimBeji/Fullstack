<template>
    <component
        :is="tagConfig.tag"
        v-bind="tagConfig.props"
        :class="['btn', colorClass, inverseClass, customClasses]"
    >
        <slot />
    </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

import { ButtonType } from "@/types";

// Props
const props = defineProps<{
    disabled?: boolean;
    inverse?: boolean;
    color?: "primary" | "secondary" | "success" | "warning" | "danger";
    className?: string;
    to?: string;
    href?: string;
    type?: ButtonType;
    onClick?: () => void;
}>();

// Computed
const disabled = computed(() => props.disabled ?? false);

const customClasses = computed(() => props.className || "");

const inverseClass = computed(() =>
    props.inverse && !disabled.value ? "inverse" : ""
);

const colorClass = computed(() =>
    disabled.value ? "disabled" : props.color || "primary"
);

const tagConfig = computed(() => {
    if (props.href) {
        return {
            tag: "a",
            props: { href: props.href },
        };
    }
    if (props.to) {
        return {
            tag: RouterLink,
            props: { to: props.to },
        };
    }
    return {
        tag: "button",
        props: {
            type: props.type || "button",
            onClick: props.onClick,
            disabled: props.disabled ?? false,
        },
    };
});
</script>

<style lang="css">
@reference "../../main.css";

@layer components {
    .btn {
        @apply inline-block px-6 py-2 rounded-md text-base font-medium;
        @apply transition-colors duration-200 focus:outline-none;
    }
}
</style>
