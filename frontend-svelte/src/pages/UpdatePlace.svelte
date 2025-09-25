<script lang="ts">
const { route } = $props();
const placeId: string = route.result.path.params.placeId;
</script>

<h1>Update existing place with id: {placeId}</h1>
