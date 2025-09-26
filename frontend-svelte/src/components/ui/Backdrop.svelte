<script lang="ts">
import { onMount, onDestroy } from "svelte";

// Setup
let backdropElement: HTMLElement | undefined;
const targetElement = document.getElementById("backdrop-hook"); 

// Props
const {onClick} = $props<{
    onClick: () => void
}>()

// Events
onMount(() => {
    if (targetElement && backdropElement) {
        targetElement.appendChild(backdropElement);
    }
});

onDestroy(() => {
    targetElement?.removeChild(backdropElement!)
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
