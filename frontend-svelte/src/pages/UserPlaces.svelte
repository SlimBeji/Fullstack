<script lang="ts">
import { HttpStatusCode } from "axios";
import { onMount } from "svelte";

import { HttpError, LoadingSpinner } from "@/components/ui";
import { useHttp } from "@/lib";
import { authStore } from "@/store";
import type { Place } from "@/types";

// Init
const { route } = $props();
const userId: string = route.result.path.params.userId;
const { httpData, sendRequest, clear } = useHttp({ ignoreNotFound: true });
const loggedUserId = authStore.userId;

// Events
onMount(() => {
    fetchPlaces(userId);
});

// Computed
const isUserOwned = $derived<boolean>(userId === $loggedUserId);

const places = $derived<Place[]>(
    $httpData.statusCode === HttpStatusCode.NotFound
        ? []
        : $httpData.json?.data || []
);

// Handlers
const fetchPlaces = (userId: string | undefined) => {
    if (!userId) return;
    sendRequest(`/places/?creatorId=${userId}`, "get").catch((err) =>
        console.log(err)
    );
};

const deleteHandler = async () => {
    fetchPlaces(userId);
};
</script>

{#if $httpData.error?.message}
    <HttpError onClose={clear} error={$httpData.error} />
{/if}
{#if $httpData.loading}
    <LoadingSpinner asOverlay />
{/if}
<span>{isUserOwned}</span>
<span>{deleteHandler}</span>
<pre>{places}</pre>
