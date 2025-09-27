<script lang="ts">
import type { AxiosResponse } from "axios";
import { onMount } from "svelte";

import { Button, Input } from "@/components/form";
import { HttpError, LoadingSpinner } from "@/components/ui";
import type { FormConfig } from "@/lib";
import { minLengthValidator, numericValidator, useForm, useHttp } from "@/lib";
import type { Place } from "@/types";

// Init
const { httpData, sendRequest, clear } = useHttp();

// Props
const props = $props<{ placeId: string }>();

// Form
const UpdatePlaceFormConfig: FormConfig = {
    title: { validators: [minLengthValidator(10)] },
    address: { validators: [minLengthValidator(1)] },
    description: { validators: [minLengthValidator(10)] },
    lat: { validators: [numericValidator()] },
    lng: { validators: [numericValidator()] },
};

type FieldsType = keyof typeof UpdatePlaceFormConfig;

const { fields, formValid, prefillData } = useForm<FieldsType>(
    UpdatePlaceFormConfig
);
const { title, address, description, lat, lng } = fields;

// Events
onMount(() => {
    sendRequest(`/places/${props.placeId}`, "get").then(
        (resp: AxiosResponse<Place>) => {
            const { data } = resp;
            prefillData({
                title: data.title,
                address: data.address,
                description: data.description,
                lat: String(data.location.lat),
                lng: String(data.location.lng),
            });
        }
    );
});

// Handlers
const submitHandler = async (e: Event) => {
    e.preventDefault();
    try {
        await sendRequest(`/places/${props.placeId}`, "put", {
            title: $title.value,
            address: $address.value,
            description: $description.value,
            location: {
                lat: $lat.value,
                lng: $lng.value,
            },
        });
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
<form onsubmit={submitHandler} class="place-update">
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
    <div class="buttons">
        <Button disabled={!$formValid} type="submit" color="secondary">
            Edit Place
        </Button>
    </div>
</form>

<style lang="css">
@reference "@/main.css";

.place-update {
    @apply flex flex-wrap;
    @apply relative w-[90%] max-w-160 my-0 mx-auto p-4;
    @apply list-none shadow-md rounded-md bg-surface;
}

.place-update .buttons {
    @apply w-full mt-10 text-right;
}
</style>
