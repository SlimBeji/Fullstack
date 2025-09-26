<script lang="ts">
import { Backdrop } from "@/components/ui";

import NavLinks from "./NavLinks.svelte";

let showBackdrop = $state(true);

function clickHandler() {
    showBackdrop = false;
}
</script>

<NavLinks />
{#if showBackdrop}
    <Backdrop onClick={clickHandler} />
{/if}

<h1>Main Navigation</h1>
