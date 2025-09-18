<template>
    <Modal
        v-if="isTokenExpired"
        :onCancel="props.onClear"
        header="Session expired"
        :show="!!props.error"
    >
        <p>Token expired! Please login again!</p>
        <template #footer>
            <Button :onClick="tokenExpiredCleaner">Authenticate</Button>
        </template>
    </Modal>
    <ErrorModal
        v-else
        :error="props.error?.message"
        :header="props.header"
        :onClear="props.onClear"
    />
</template>

<script setup lang="ts">
import { AxiosResponse } from "axios";
import { computed } from "vue";

import { Button } from "@/components/form";
import { useAuthStore } from "@/stores";

import ErrorModal from "./ErrorModal.vue";
import Modal from "./Modal.vue";

const authStore = useAuthStore();

// Props
const props = defineProps<{
    error?: {
        tokenExpired?: boolean;
        message?: string;
        response?: AxiosResponse;
    };
    onClear: () => void;
    header?: string;
}>();

// Computed
const isTokenExpired = computed(() => {
    return props.error?.tokenExpired;
});

// Handlers
const tokenExpiredCleaner = () => {
    props.onClear();
    authStore.logout();
};
</script>
