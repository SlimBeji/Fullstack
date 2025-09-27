<script lang="ts">
import clsx from "clsx";

import { fileToUrl } from "@/lib";

import Button from "./Button.svelte";

// Init
let filePickerRef: HTMLInputElement | null = null;

// Props
let {
    value = $bindable<{ file: File | null; url: string }>(),
    valid = $bindable<boolean>(true),
    ...props
} = $props<{
    value: { file: File | null; url: string };
    valid?: boolean;
    id: string;
    buttonText?: string;
    disabled?: boolean;
    inverse?: boolean;
    color?: "primary" | "secondary" | "success" | "warning" | "danger";
    errorText?: string;
}>();

// State
let uploadError = $state<string>("");
let uploadAttempt = $state<boolean>(false);

// Computed
const inverseClass = $derived(
    props.inverse && !props.disabled ? "inverse" : ""
);

const colorClass = $derived(
    props.disabled ? "disabled" : props.color || "primary"
);

const showError = $derived(
    valid === undefined ? false : uploadAttempt && (!!uploadError || !valid)
);

// Handlers
const changeHandler = async (event: Event) => {
    uploadAttempt = true;
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) {
        value = { file: null, url: "" };
        uploadError = "Something went wrong! No file found!";
    } else if (files.length > 1) {
        value = { file: null, url: "" };
        uploadError = "Please upload only one file at a time!";
    } else {
        try {
            const url = await fileToUrl(files[0]);
            const file = (value.file = files[0]);
            value = { file, url };
            uploadError = "";
        } catch {
            uploadError = "Uploaded file corrupted";
        }
    }
};

const clickHandler = () => {
    filePickerRef?.click();
};
</script>

<div class="image-upload">
    <input
        onchange={changeHandler}
        id={props.id}
        bind:this={filePickerRef}
        class="hidden"
        type="file"
        accept=".jpg,.png,.jpeg"
    />
    <div>
        <div class:error={showError}>
            {#if value.url}
                <img src={value.url} alt="Preview" />
            {:else}
                <p class="placeholder">Please pick an image.</p>
            {/if}
        </div>
        <Button
            onClick={clickHandler}
            class={clsx(["btn", colorClass, inverseClass])}
            type="button"
            disabled={!!props.disabled}
        >
            {props.buttonText || "Pick an image"}
        </Button>
    </div>
    <p class="error-text" class:invisible={!showError}>
        {props.errorText || uploadError}
    </p>
</div>

<style lang="css">
@reference "@/main.css";

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
</style>
