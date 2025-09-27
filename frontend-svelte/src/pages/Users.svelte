<script lang="ts">
import { HttpError, LoadingSpinner } from "@/components/ui";
import { useHttp } from "@/lib";
import type { User } from "@/types";

// Init
const { httpData, sendRequest, clear } = useHttp();
sendRequest("/users/", "get");

// Computed
const items = $derived<User[]>($httpData.json?.data ?? []);
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
{#if $httpData.json?.data}
    <pre>{items}</pre>
{/if}
