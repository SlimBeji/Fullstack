<template>
    <div class="image-upload">
        <input
            @change="changeHanlder"
            :id="props.id"
            ref="filePicker"
            class="hidden"
            type="file"
            accept=".jpg,.png,.jpeg"
        />
        <div>
            <div :class="{ error: showError }">
                <img v-if="data.url" :src="data.url" alt="Preview" />
                <p v-else class="placeholder">Please pick an image.</p>
            </div>
            <Button
                @click="clickHandler"
                :class="[`btn`, colorClass, inverseClass]"
                type="button"
                :disabled="disabled ?? false"
            >
                {{ props.buttonText || "Pick an image" }}
            </Button>
        </div>
        <p class="error-text" :class="{ invisible: !showError }">
            {{ props.errorText || uploadError }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";

import { fileToUrl } from "@/lib";

import Button from "./Button.vue";

const filePickerRef = useTemplateRef<HTMLInputElement>("filePicker");

// Props
const data = defineModel<{ file: File | null; url: string }>({
    required: true,
});

const props = defineProps<{
    id: string;
    isValid?: boolean;
    buttonText?: string;
    disabled?: boolean;
    inverse?: boolean;
    color?: "primary" | "secondary" | "success" | "warning" | "danger";
    errorText?: string;
}>();

// State
const uploadError = ref<string>("");
const uploadAttempt = ref<boolean>(false);

// Computed
const disabled = computed(() => props.disabled ?? false);

const inverseClass = computed(() =>
    props.inverse && !disabled.value ? "inverse" : ""
);

const colorClass = computed(() =>
    disabled.value ? "disabled" : props.color || "primary"
);

const showError = computed(
    () => (!props.isValid || !!uploadError.value) && uploadAttempt.value
);

// Hanlders
const changeHanlder = async (event: Event) => {
    uploadAttempt.value = true;
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) {
        data.value.file = null;
        data.value.url = "";
        uploadError.value = "Something went wrong! No file found!";
    } else if (files.length > 1) {
        data.value.file = null;
        data.value.url = "";
        uploadError.value = "Please upload only one file at a time!";
    } else {
        try {
            data.value.url = await fileToUrl(files[0]);
            data.value.file = files[0];
            uploadError.value = "";
        } catch {
            uploadError.value = "Uploaded file corrupted";
        }
    }
};

const clickHandler = () => {
    filePickerRef.value?.click();
};
</script>

<style lang="css">
@reference "../../main.css";

@layer components {
    .image-upload {
        @apply w-full mb-4;
    }

    .image-upload > div {
        @apply flex flex-col items-center justify-center;
    }

    .image-upload > div > div {
        @apply flex items-center justify-center text-center overflow-hidden;
        @apply w-52 h-52 mb-4 border rounded-md;
        @apply border-pen-ruler bg-surface-on;
    }

    .image-upload .placeholder {
        @apply text-pen-muted;
    }

    .image-upload img {
        @apply w-full h-full object-cover;
    }

    .image-upload .error-text {
        @apply mt-1 text-sm text-danger;
    }
}
</style>
