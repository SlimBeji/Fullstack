<template>
    <Backdrop v-if="drawerIsOpen" @click="closeDrawer" />
    <SideDrawer @click="closeDrawer" :show="drawerIsOpen">
        <nav className="sidedrawer">
            <NavLinks />
        </nav>
    </SideDrawer>
    <header class="main-header">
        <div>
            <button v-if="isLoggedIn" class="hamburger" @click="openDrawer">
                <span />
                <span />
                <span />
            </button>
            <h1 className="app-header">
                <RouterLink to="/">Your Places</RouterLink>
            </h1>
            <nav v-if="isLoggedIn" class="main">
                <NavLinks />
            </nav>
        </div>
    </header>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";

import { Backdrop } from "@/components/ui";
import { useAuthStore } from "@/stores";

import NavLinks from "./NavLinks.vue";
import SideDrawer from "./SideDrawer.vue";

const { isLoggedIn } = useAuthStore();

// State
const drawerIsOpen = ref<boolean>(false);

// Hanlders
const openDrawer = () => {
    drawerIsOpen.value = true;
};

const closeDrawer = () => {
    drawerIsOpen.value = false;
};
</script>

<style lang="css">
@reference "../../main.css";
@layer components {
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
}
</style>
