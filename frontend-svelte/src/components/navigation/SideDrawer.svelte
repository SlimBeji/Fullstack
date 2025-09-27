<script lang="ts">
import { onDestroy, onMount } from "svelte";
import { fly } from "svelte/transition";

// Init
const targetElement = document.getElementById("drawer-hook");

// Props
const { show, onClick, children } = $props<{
    show: boolean;
    onClick: () => void;
    children?: () => unknown;
}>();

// States
let drawerElement = $state<HTMLElement | undefined>(undefined);
let drawerWidth = $state<number>(0);

// Events
onMount(() => {
    if (targetElement && drawerElement) {
        updateWidth();
        window.addEventListener("resize", updateWidth);
        targetElement.appendChild(drawerElement);
    }
});

onDestroy(() => {
    try {
        window.removeEventListener("resize", updateWidth);
    } catch (err) {
        console.log(err);
    }
    if (drawerElement && targetElement?.contains(drawerElement)) {
        targetElement.removeChild(drawerElement);
    }
});

// Handlers
const updateWidth = () => {
    if (drawerElement) drawerWidth = drawerElement.offsetWidth;
};
</script>

{#if show}
    <div
        role="button"
        tabindex="0"
        onkeydown={onClick}
        onclick={onClick}
        class="sidedrawer"
        bind:this={drawerElement}
        transition:fly={{ x: -drawerWidth, duration: 200, opacity: 0 }}
    >
        {@render children?.()}
    </div>
{/if}

<style lang="css">
@reference "@/main.css";

.sidedrawer {
    @apply fixed z-40 top-0 left-0 h-screen w-[70%];
    @apply bg-surface shadow-md;
}
</style>
