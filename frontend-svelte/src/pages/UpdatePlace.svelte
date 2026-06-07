<script lang="ts">
import { PlaceUpdateForm } from "@/components/places";

// Props
const { route } = $props();

// Computed
const placeId: string = $derived(route.result.path.params.placeId);

</script>

<PlaceUpdateForm {placeId} />
