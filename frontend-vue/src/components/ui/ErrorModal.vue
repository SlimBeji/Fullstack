<template>
    <Modal
        :onCancel="props.onClear"
        :show="!!props.error"
        :header="props.header || `An Error Occured!`"
    >
        <p>{{ props.error }}</p>
        <template #footer>
            <Button :onClick="props.onClear">Okay</Button>
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
    onClear: () => void;
}>();
</script>
