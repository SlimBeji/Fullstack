<script lang="ts">
import clsx from "clsx";

import type { CssClass } from "@/types";

// Props
let {
    value = $bindable<string>(),
    valid = $bindable<boolean>(),
    ...props
} = $props<{
    value: string;
    valid: boolean;
    id: string;
    label: string;
    class?: CssClass;
    element?: "input" | "textarea";
    type?: HTMLInputElement["type"];
    step?: string;
    disabled?: boolean;
    rows?: number;
    placeholder?: string;
    errorText?: string;
}>();

// State
let isTouched = $state<boolean>(false);

/// Computed
const customClass = $derived<CssClass>(
    props.class ? props.class : "basis-full"
);

const inputClass = $derived<string>(!props.disabled ? "active" : "disabled");

const showError = $derived<boolean>(
    valid === undefined ? false : !valid && isTouched
);

const tag = $derived(props.element ?? "input");

// Handlers
const inputTouched = () => {
    if (!props.disabled) isTouched = true;
};
</script>

<div class={clsx(["input-container", customClass, { error: showError }])}>
    <label for={props.id}>{props.label}</label>
    {#if tag === "input"}
        <input
            bind:value
            onblur={inputTouched}
            id={props.id}
            disabled={props.disabled ?? false}
            type={props.type}
            step={props.step}
            placeholder={props.placeholder}
            class={inputClass}
        />
    {:else}
        <textarea
            bind:value
            onblur={inputTouched}
            id={props.id}
            rows={props.rows || 3}
            disabled={props.disabled ?? false}
            class={inputClass}
        ></textarea>
    {/if}
    <p class={clsx(["error-text", { invisible: !showError }])}>
        {props.errorText || "The input is not valid"}
    </p>
</div>

<style lang="css">
@reference "@/main.css";

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
</style>
