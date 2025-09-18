<template>
    <Modal
        @close="emit('close')"
        :show="!!props.error"
        :header="props.header || `An Error Occured!`"
    >
        <p>{{ props.error }}</p>
        <template #footer>
            <Button @click="emit('close')">Okay</Button>
        </template>
    </Modal>
</template>

<script setup lang="ts">
import { Button } from "@/components/form";

import Modal from "./Modal.vue";

// Props
const props = defineProps<{
    error?: string;
    header?: string;
}>();

// Events
const emit = defineEmits<{
    (e: "close"): void;
}>();
</script>
