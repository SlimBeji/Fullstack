<script lang="ts">
import type { AxiosResponse } from "axios";

import { Button } from "@/components/form";
import { authStore } from "@/store";

import ErrorModal from "./ErrorModal.svelte";
import Modal from "./Modal.svelte";

// Props
const { error, header, onClose } = $props<{
    error?: {
        tokenExpired?: boolean;
        message?: string;
        response?: AxiosResponse;
    };
    header?: string;
    onClose: () => void;
}>();

// Computed
const isTokenExpired = $derived<boolean>(error?.tokenExpired ?? false);

// Handlers
const tokenExpiredCleaner = () => {
    onClose();
    authStore.logout();
};
</script>

{#if isTokenExpired}
    <Modal
        show={!!error}
        onClose={tokenExpiredCleaner}
        header="Session expired"
    >
        <p class="text-error">Token expired! Please login again!</p>
        {#snippet footer()}
            <Button onClick={tokenExpiredCleaner}>Authenticate</Button>
        {/snippet}
    </Modal>
{:else}
    <ErrorModal error={error.message} {header} {onClose} />
{/if}

<style lang="css">
@reference "@/main.css";

.text-error {
    @apply p-5;
}
</style>
