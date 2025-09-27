<script lang="ts">
import { goto } from "@mateothegreat/svelte5-router";

import { Button, ImageUpload, Input } from "@/components/form";
import { HttpError, LoadingSpinner } from "@/components/ui";
import type { FormConfig } from "@/lib";
import { minLengthValidator, numericValidator, useForm, useHttp } from "@/lib";
import { authStore } from "@/store";

// Init
const loggedUserId = authStore.userId;
const { httpData, sendRequest, clear } = useHttp();

// Form
const CreatePlaceFormConfig: FormConfig = {
    title: { validators: [minLengthValidator(10)] },
    address: { validators: [minLengthValidator(1)] },
    description: { validators: [minLengthValidator(10)] },
    lat: { validators: [numericValidator()] },
    lng: { validators: [numericValidator()] },
    image: { initial: { file: null, url: "" } },
};

type FieldsType = keyof typeof CreatePlaceFormConfig;

const { fields, formValid } = useForm<FieldsType>(CreatePlaceFormConfig);
const { title, address, description, lat, lng, image } = fields;

// Handlers
const submitHandler = async (e: Event) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", $title.value);
    formData.append("image", $image.value.file);
    formData.append("description", $description.value);
    formData.append("address", $address.value);
    formData.append(
        "location",
        JSON.stringify({
            lat: $lat.value,
            lng: $lng.value,
        })
    );
    formData.append("creatorId", $loggedUserId as string);
    try {
        await sendRequest("/places/", "post", formData);
        goto("/");
    } catch (err) {
        console.log(err);
    }
};
</script>

{#if $httpData.error?.message}
    <HttpError onClose={clear} error={$httpData.error} />
{/if}
{#if $httpData.loading}
    <LoadingSpinner asOverlay />
{/if}
<form onsubmit={submitHandler} class="place-create">
    <Input
        bind:value={$title.value}
        bind:valid={$title.valid}
        id="title"
        element="input"
        type="text"
        label="Title"
        errorText="Please enter a valid Title"
    />
    <Input
        bind:value={$address.value}
        bind:valid={$address.valid}
        id="address"
        element="input"
        type="text"
        label="Address"
        errorText="Please enter a valid address"
    />
    <Input
        bind:value={$description.value}
        bind:valid={$description.valid}
        id="description"
        element="textarea"
        label="Description"
        errorText="Please enter a valid Description"
    />
    <Input
        bind:value={$lat.value}
        bind:valid={$lat.valid}
        class="basis-full sm:basis-1/2 sm:pr-2"
        id="latitude"
        element="input"
        type="number"
        label="Latitude"
        errorText="Please enter a valid Latitude"
    />
    <Input
        bind:value={$lng.value}
        bind:valid={$lng.valid}
        class="basis-full sm:basis-1/2 sm:pl-2"
        id="longitude"
        element="input"
        type="number"
        label="Longitude"
        errorText="Please enter a valid Longitude"
    />
    <ImageUpload
        bind:value={$image.value}
        bind:valid={$image.valid}
        id="image"
        color="secondary"
    />
    <div class="buttons">
        <Button disabled={!$formValid} type="submit" color="secondary">
            Add Place
        </Button>
    </div>
</form>

<style lang="css">
@reference "@/main.css";

.place-create {
    @apply flex flex-wrap;
    @apply relative w-[90%] max-w-160 my-0 mx-auto p-4;
    @apply list-none shadow-md rounded-md bg-surface;
}

.place-create .buttons {
    @apply w-full mt-10 text-right;
}
</style>
