<script lang="ts">
import { Button } from "@/components/form";

import Modal from "./Modal.svelte";

// Props
const {
    error,
    header = "An Error Occured!",
    onClose,
} = $props<{
    error?: string;
    header?: string;
    onClose: () => void;
}>();
</script>

<Modal {onClose} show={!!error} {header}>
    <p>{error}</p>
    {#snippet footer()}
        <Button onClick={onClose}>Okay</Button>
    {/snippet}
</Modal>
