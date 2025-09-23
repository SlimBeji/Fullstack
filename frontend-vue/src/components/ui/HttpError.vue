<template>
    <Modal
        v-if="isTokenExpired"
        @close="emit('close')"
        header="Session expired"
        :show="!!props.error"
    >
        <p>Token expired! Please login again!</p>
        <template #footer>
            <Button :onClick="tokenExpiredCleaner">Authenticate</Button>
        </template>
    </Modal>
    <ErrorModal
        v-else-if="props.error"
        @close="emit('close')"
        :error="props.error.message"
        :header="props.header"
    />
</template>

<script setup lang="ts">
import { AxiosResponse } from "axios";
import { computed } from "vue";

import { Button } from "@/components/form";
import { useAuthStore } from "@/store";

import ErrorModal from "./ErrorModal.vue";
import Modal from "./Modal.vue";

// Init
const authStore = useAuthStore();

// Props
const props = defineProps<{
    error?: {
        tokenExpired?: boolean;
        message?: string;
        response?: AxiosResponse;
    };
    header?: string;
}>();

// Events
const emit = defineEmits<{
    (e: "close"): void;
}>();

// Computed
const isTokenExpired = computed(() => {
    return props.error?.tokenExpired;
});

// Handlers
const tokenExpiredCleaner = () => {
    emit("close");
    authStore.logout();
};
</script>
