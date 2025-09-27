<script lang="ts">
import { onMount } from "svelte";

import { HttpError, LoadingSpinner } from "@/components/ui";
import { UsersList } from "@/components/user";
import { useHttp } from "@/lib";
import type { User } from "@/types";

// Init
const { httpData, sendRequest, clear } = useHttp();

// Computed
let items = $derived<User[]>($httpData.json?.data ?? []);

// Events
onMount(() => {
    sendRequest("/users/", "get");
});
</script>

{#if $httpData.error?.message}
    <HttpError
        onClose={clear}
        error={$httpData.error}
        header="Could not fetch users!"
    />
{/if}
{#if $httpData.loading}
    <LoadingSpinner asOverlay />
{/if}
{#if items.length}
    <UsersList {items} />
{/if}
