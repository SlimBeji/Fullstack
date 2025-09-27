<script lang="ts">
import { Button } from "@/components/form";
import type { Place } from "@/types";

// Props
const props = $props<{
    sameAuthenticatedUser?: boolean;
    items: Place[];
    onDelete: () => void;
}>();
</script>

<ul class="places-list">
    {#if props.items.length > 0}
        {#each props.items as place (place.id)}
            <pre>{place}</pre>
            <pre>onDelete</pre>
        {/each}
    {:else if props.sameAuthenticatedUser}
        <div class="no-places">
            <div class="card">
                <h2>No places found. Maybe create one?</h2>
                <Button color="secondary" to="/places/new">Share</Button>
            </div>
        </div>
    {:else}
        <div class="no-places">
            <div class="card">
                <h2>This user has not created places yet</h2>
            </div>
        </div>
    {/if}
</ul>

<style lang="css">
@reference "@/main.css";

.places-list {
    @apply w-[90%] max-w-[40rem] my-4 mx-auto p-0 list-none;
}

.no-places {
    @apply mx-auto w-100 max-w-[90%];
}

.no-places .card {
    @apply p-5 text-center;
}

.no-places .card h2 {
    @apply my-5;
}
</style>
