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
            <div>
                <img v-if="url" :src="url" alt="Preview" />
                <p v-if="!url" class="placeholder">Please pick an image.</p>
            </div>
            <Button
                @click="clickHandler"
                :class="[
                    `btn`,
                    colorClass,
                    inverseClass,
                    { disabled: disabled },
                ]"
                type="button"
                :disabled="disabled ?? false"
            >
                PICK IMAGE
            </Button>
        </div>
        <p class="error-text" :class="{ invisible: !isError }">
            {{ props.errorText || errorMessage }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";

import { fileToUrl } from "@/lib";

import Button from "./Button.vue";

const filePickerRef = useTemplateRef<HTMLInputElement>("filePicker");

// Props
interface ImageUploadValue {
    file: File | null;
    url: string;
}

const props = defineProps<{
    id: string;
    disabled?: boolean;
    inverse?: boolean;
    color?: "primary" | "secondary" | "success" | "warning" | "danger";
    onInput: (val: ImageUploadValue, isValid: boolean) => void;
    errorText?: string;
    val?: ImageUploadValue;
    required?: boolean;
}>();

// State
const file = ref<File | null>(props.val?.file || null);
const url = ref<string>(props.val?.url || "");
const errorMessage = ref<string>("");
const uploadAttempt = ref<boolean>(false);

// Computed
const disabled = computed(() => props.disabled ?? false);

const inverseClass = computed(() =>
    props.inverse && !disabled.value ? "inverse" : ""
);

const colorClass = computed(() =>
    disabled.value ? "disabled" : props.color || "primary"
);

const isValid = computed(() => {
    if (props.required) {
        return errorMessage.value === "" && !!url.value;
    } else {
        return errorMessage.value === "";
    }
});

const isError = computed(() => !!errorMessage.value && uploadAttempt.value);

// Hanlders
const emitUpdate = () => {
    props.onInput({ file: file.value, url: url.value }, isValid.value);
};

const changeHanlder = async (event: Event) => {
    uploadAttempt.value = true;
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) {
        file.value = null;
        url.value = "";
        errorMessage.value = "Something went wrong! No file found!";
    } else if (files.length > 1) {
        file.value = null;
        url.value = "";
        errorMessage.value = "Please upload only one file at a time!";
    } else {
        try {
            url.value = await fileToUrl(files[0]);
            file.value = files[0];
            errorMessage.value = "";
        } catch {
            errorMessage.value = "Uploaded file corrupted";
        }
    }
    emitUpdate();
};

const clickHandler = () => {
    filePickerRef.value?.click();
};

// Events
onMounted(() => {
    // Emit an update on compount mounting in case the Image
    // is required and no value provided initially
    emitUpdate();
});
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
