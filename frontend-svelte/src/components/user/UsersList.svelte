<script lang="ts">
import type { User } from "@/types";

import UserItem from "./UserItem.svelte";

// Props
const props = $props<{ items: User[] }>();
const items: User[] = props.items;

// Computed
const noUsers = $derived<boolean>(items.length === 0);
</script>

{#if noUsers}
    <div class="no-users">
        <div class="card">
            <h2>No Users found!</h2>
        </div>
    </div>
{:else}
    <div class="users-list">
        {#each items as item (item.id)}
            <UserItem user={item} />
        {/each}
    </div>
{/if}

<style lang="css">
@reference "@/main.css";

.users-list {
    @apply flex flex-wrap gap-6;
    @apply w-[90%] max-w-4xl mx-auto;
}

.no-users {
    @apply flex justify-center items-center;
}

.no-users h2 {
    @apply text-xl font-semibold text-pen;
}
</style>
