<script lang="ts">
const { route } = $props();
const userId: string = route.result.path.params.userId;
</script>

<h1>List of a user {userId} places</h1>
