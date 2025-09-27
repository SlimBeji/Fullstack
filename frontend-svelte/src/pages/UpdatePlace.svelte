<script lang="ts">
import { PlaceUpdateForm } from "@/components/places";

// Props
const { route } = $props();
const placeId: string = route.result.path.params.placeId;
</script>

<PlaceUpdateForm {placeId} />
