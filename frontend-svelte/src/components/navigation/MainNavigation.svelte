<script lang="ts">
import { route } from "@mateothegreat/svelte5-router";

import { Backdrop } from "@/components/ui";
import { authStore } from "@/store";

import NavLinks from "./NavLinks.svelte";
import SideDrawer from "./SideDrawer.svelte";

// Setup
const isLoggedIn = authStore.isLoggedIn;

// States
let drawerIsOpen = $state<boolean>(false);

// Handlers
const openDrawer = () => {
    drawerIsOpen = true;
};

const closeDrawer = () => {
    drawerIsOpen = false;
};
</script>

{#if drawerIsOpen}
    <Backdrop onClick={closeDrawer} />
{/if}

<SideDrawer show={drawerIsOpen} onClick={closeDrawer}>
    <nav class="sidedrawer">
        <NavLinks />
    </nav>
</SideDrawer>
<header class="main-header">
    <div>
        {#if $isLoggedIn}
            <button
                aria-label="hamburger button"
                onclick={openDrawer}
                class="hamburger"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>
        {/if}
        <h1 class="app-header">
            <a href="/" use:route>Your Places</a>
        </h1>
        {#if $isLoggedIn}
            <nav class="main">
                <NavLinks />
            </nav>
        {/if}
    </div>
</header>

<style lang="css">
@reference "@/main.css";

.main-header {
    @apply flex fixed z-50 top-0 left-0;
    @apply w-full h-16 px-4 shadow-md;
    @apply bg-primary;
}

.main-header > div {
    @apply flex items-center w-full max-w-screen-xl mx-auto;
    @apply bg-transparent;
}

nav.main {
    @apply hidden md:block ml-auto;
}

nav.sidedrawer {
    @apply h-full;
}

h1.app-header {
    @apply text-2xl font-bold text-pen-inverse;
}

button.hamburger {
    @apply flex flex-col justify-around md:hidden;
    @apply w-12 h-12 mr-8 border-none bg-transparent cursor-pointer;
}

button.hamburger span {
    @apply block w-12 h-1 bg-surface;
}
</style>
