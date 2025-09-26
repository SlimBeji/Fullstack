<script lang="ts">
import { route } from "@mateothegreat/svelte5-router";
import clsx from "clsx";

import type { ButtonType, CssClass } from "@/types";

// Props
const props = $props<{
    children: () => unknown;
    disabled?: boolean;
    inverse?: boolean;
    color?: "primary" | "secondary" | "success" | "warning" | "danger";
    class?: CssClass;
    to?: string;
    href?: string;
    type?: ButtonType;
    onClick?: () => void;
}>();

// Computed
const disabled = $derived<boolean>(props.disabled ?? false);

const customClasses = $derived<string>(props.class || "");

const inverseClass = $derived<string>(
    props.inverse && !disabled ? "inverse" : ""
);

const colorClass = $derived<string>(
    disabled ? "disabled" : props.color || "primary"
);

const tagConfig = $derived(
    props.href
        ? { tag: "a", props: { href: props.href }, useRoute: false }
        : props.to
          ? { tag: "a", props: { href: props.to }, useRoute: true }
          : {
                tag: "button",
                props: {
                    type: props.type || "button",
                    disabled: props.disabled ?? false,
                },
                useRoute: false,
            }
);

// Handlers
const clickHandler = () => {
    if (!disabled) props.onClick?.();
};
</script>

{#if tagConfig.useRoute}
    <svelte:element
        this={tagConfig.tag}
        {...tagConfig.props}
        use:route
        class={clsx(["btn", colorClass, inverseClass, customClasses])}
        onclick={clickHandler}
    >
        {@render props.children()}
    </svelte:element>
{:else}
    <svelte:element
        this={tagConfig.tag}
        {...tagConfig.props}
        class={clsx(["btn", colorClass, inverseClass, customClasses])}
        onclick={clickHandler}
    >
        {@render props.children()}
    </svelte:element>
{/if}

<style lang="css">
@reference "@/main.css";

.btn {
    @apply inline-block px-6 py-2 rounded-md text-base font-medium;
    @apply transition-colors duration-200 focus:outline-none;
}
</style>
