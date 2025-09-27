<script lang="ts">
import { onDestroy, onMount } from "svelte";
import { cubicOut } from "svelte/easing";
import { fly } from "svelte/transition";

import Backdrop from "./Backdrop.svelte";

// Init
const targetElement = document.getElementById("modal-hook");

// Props
const { show, header, style, onClose, onSubmit, children, footer } = $props<{
    show: boolean;
    header: string;
    style?: string;
    onClose: () => void;
    onSubmit?: (e: Event) => void;
    children: () => unknown;
    footer?: () => unknown;
}>();

// States
let modalElement = $state<HTMLElement | undefined>(undefined);

// Events
onMount(() => {
    if (targetElement && modalElement) {
        targetElement.appendChild(modalElement);
    }
});

onDestroy(() => {
    if (modalElement && targetElement?.contains(modalElement)) {
        targetElement.removeChild(modalElement);
    }
});

// Handlers
const submitHanlder = (e: Event) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
};
</script>

{#if show}
    <Backdrop onClick={onClose} />
    <div
        class="modal-container"
        {style}
        transition:fly={{
            y: -80,
            duration: 300,
            easing: cubicOut,
            opacity: 0,
        }}
        bind:this={modalElement}
    >
        <header>
            <h2>{header}</h2>
        </header>
        <form onsubmit={submitHanlder}>
            {@render children()}
            <footer>
                {@render footer()}
            </footer>
        </form>
    </div>
{/if}

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

.modal-container form > footer {
    @apply flex justify-end space-x-2 p-4;
}
</style>
