<template>
    <ul class="links-container">
        <li>
            <RouterLink exact-active-class="active" to="/"
                >All users</RouterLink
            >
        </li>
        <li>
            <RouterLink exact-active-class="active" to="/places/new"
                >Add Place</RouterLink
            >
        </li>
        <li>
            <RouterLink exact-active-class="active" :to="`/${userId}/places`"
                >My places</RouterLink
            >
        </li>
        <li>
            <button @click="logout">LOGOUT</button>
        </li>
    </ul>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";

import { useAuthStore } from "@/stores";

const router = useRouter();
const authStore = useAuthStore();
const userId = authStore.userId;

// Hanlders
const logout = () => {
    authStore.logout();
    router.push("/auth");
};
</script>

<style lang="css">
@reference "../../main.css";

@layer components {
    ul.links-container {
        @apply flex flex-col justify-center items-center md:flex-row;
        @apply w-full h-full m-0 p-0 list-none;
    }

    ul.links-container li {
        @apply m-4 md:mx-2 md:my-0;
    }

    ul.links-container li a,
    ul.links-container li button {
        @apply w-32 px-2 py-1;
        @apply text-center border rounded-sm text-lg cursor-pointer;
        @apply text-pen-inverse bg-primary border-transparent;
        @apply md:border-transparent;
        @apply hover:bg-primary-surface hover:text-pen hover:border-transparent;
    }

    ul.links-container li .active {
        @apply bg-primary-on border-transparent;
        @apply md:bg-primary-surface md:text-pen;
    }

    ul.links-container li a {
        @apply block no-underline;
    }

    ul.links-container li button {
        @apply border border-transparent md:border-pen-inverse;
    }
}
</style>
