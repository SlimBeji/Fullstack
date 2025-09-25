<script lang="ts">
import {Backdrop} from "@/components/ui";

let showBackdrop = $state(true)

function clickHandler() {
    showBackdrop = false
}
</script>

{#if showBackdrop }
    <Backdrop onClick={clickHandler} />
{/if}

<h1>Main Navigation</h1>
