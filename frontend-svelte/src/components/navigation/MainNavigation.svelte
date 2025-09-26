<script lang="ts">
import { Backdrop } from "@/components/ui";

import NavLinks from "./NavLinks.svelte";
import SideDrawer from "./SideDrawer.svelte";

let showBackdrop = $state(true);
let showSideDrawer = $state(true);

function clickHandler() {
    showBackdrop = false;
}

function closeSideDrawer() {
    showSideDrawer = false;
}
</script>
<NavLinks />
<SideDrawer show={showSideDrawer} onClick={closeSideDrawer}>
    <NavLinks />
</SideDrawer>
{#if showBackdrop}
    <Backdrop onClick={clickHandler} />
{/if}

<h1>Main Navigation</h1>
