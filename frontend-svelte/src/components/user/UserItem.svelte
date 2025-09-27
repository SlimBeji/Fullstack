<script lang="ts">
import { route } from "@mateothegreat/svelte5-router";

import placeholder from "@/assets/avatar_placeholder.jpg";
import { Avatar } from "@/components/ui";
import type { User } from "@/types";

// Props
const props = $props<{ user: User }>();
const user: User = props.user;

// Computed
const imageUrl = $derived(user.imageUrl || placeholder);
const nPlaces = $derived<number>(user.places.length);
const placeNumber = $derived(
    nPlaces > 1 ? `${nPlaces} Places` : `${nPlaces} Place`
);
</script>

<li class="user-item">
    <div class="card">
        <a use:route href={`/${props.user.id}/places`} class="user-item-link">
            <div class="user-avatar">
                <Avatar {imageUrl} alt={user.name} />
            </div>
            <div class="user-info">
                <h2>{user.name}</h2>
                <h3>{placeNumber}</h3>
            </div>
        </a>
    </div>
</li>

<style lang="css">
@reference "../../main.css";

.user-item {
    @apply w-[45%] min-w-[17.5rem] m-4 list-none;
}

.user-item .card {
    @apply p-0 rounded-xl;
    @apply hover:shadow-lg transition-shadow duration-300;
}

.user-item-link {
    @apply flex items-center;
    @apply size-full p-4 rounded-xl bg-surface-alt;
    @apply hover:bg-surface-on transition-colors duration-200;
}

.user-item .user-avatar {
    @apply w-16 h-16 mr-4;
}

.user-item .user-info h2 {
    @apply text-lg font-semibold text-pen;
}

.user-item .user-info h3 {
    @apply text-sm text-pen-muted;
}
</style>
