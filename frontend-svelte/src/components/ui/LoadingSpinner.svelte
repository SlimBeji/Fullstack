<script lang="ts">
import clsx from "clsx";

// Props
const { asOverlay } = $props<{ asOverlay?: boolean }>();
</script>

<div class={clsx(["spinner-container", { overlay: asOverlay }])}>
    <div></div>
</div>

<style lang="css">
@reference "@/main.css";
.spinner-container.overlay {
    @apply absolute inset-0 bg-surface/90 flex justify-center items-center;
}

.spinner-container > div {
    @apply w-12 h-12 rounded-full animate-spin;
    @apply border-4 border-secondary border-t-transparent;
}
</style>
