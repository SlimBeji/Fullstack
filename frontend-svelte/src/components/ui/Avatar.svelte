<script lang="ts">
// Props
const { imageUrl, alt } = $props<{ imageUrl: string; alt: string }>();
</script>

<div class="avatar-container">
    <img src={imageUrl} {alt} />
</div>

<style lang="css">
@reference "@/main.css";

.avatar-container {
    @apply w-16 h-16 overflow-hidden rounded-full;
    @apply flex justify-center items-center;
}

.avatar-container img {
    @apply w-full h-full object-cover;
}
</style>
