<script lang="ts">
import { active, goto, route } from "@mateothegreat/svelte5-router";

import { authStore } from "@/store";

// Init
const userId = authStore.userId;
const activeAction = { active: { class: "active", absolute: true } };

// Handlers
const logout = () => {
    authStore.logout();
    goto("/auth");
};
</script>

<ul class="links-container">
    <li>
        <a href="/" use:route use:active={activeAction}>All users</a>
    </li>
    <li>
        <a href="/places/new" use:active={activeAction} use:route>Add Place</a>
    </li>
    <li>
        <a href={`/${$userId}/places`} use:active={activeAction} use:route
            >My places</a
        >
    </li>
    <li>
        <button onclick={logout}>LOGOUT</button>
    </li>
</ul>

<style lang="css">
@reference "@/main.css";

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

ul.links-container li :global(.active) {
    @apply bg-primary-on border-transparent;
    @apply md:bg-primary-surface md:text-pen;
}

ul.links-container li a {
    @apply block no-underline;
}

ul.links-container li button {
    @apply border border-transparent md:border-pen-inverse;
}
</style>
