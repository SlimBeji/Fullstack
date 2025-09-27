<script lang="ts">
import { onDestroy, onMount } from "svelte";

// Init
const targetElement = document.getElementById("backdrop-hook");

// Props
const { onClick } = $props<{
    onClick: () => void;
}>();

// States
let backdropElement = $state<HTMLElement | undefined>(undefined);

// Events
onMount(() => {
    if (targetElement && backdropElement) {
        targetElement.appendChild(backdropElement);
    }
});

onDestroy(() => {
    backdropElement?.remove();
});
</script>

<div
    role="button"
    tabindex="0"
    class="modal-backdrop"
    onkeydown={onClick}
    onclick={onClick}
    bind:this={backdropElement}
></div>

<style lang="css">
@reference "@/main.css";

.modal-backdrop {
    @apply fixed top-0 left-0 w-full h-screen bg-backdrop opacity-70 z-10;
}
</style>
