<template>
    <HttpError
        v-if="httpData.error?.message"
        @close="clear"
        :error="httpData.error"
    />
    <LoadingSpinner v-else-if="httpData.loading" as-overlay />
    <form v-else @submit="submitHandler" class="place-update">
        <Input
            v-model="fields.title.value"
            :is-valid="fields.title.valid"
            id="title"
            element="input"
            type="text"
            label="Title"
            errorText="Please enter a valid Title"
        />
        <Input
            v-model="fields.address.value"
            :is-valid="fields.address.valid"
            id="address"
            element="input"
            type="text"
            label="Address"
            errorText="Please enter a valid address"
        />
        <Input
            v-model="fields.description.value"
            :is-valid="fields.description.valid"
            id="description"
            element="textarea"
            label="Description"
            errorText="Please enter a valid Description"
        />
        <Input
            v-model="fields.lat.value"
            :is-valid="fields.lat.valid"
            class="basis-full sm:basis-1/2 sm:pr-2"
            id="latitude"
            element="input"
            type="number"
            label="Latitude"
            errorText="Please enter a valid Latitude"
        />
        <Input
            v-model="fields.lng.value"
            :is-valid="fields.lng.valid"
            class="basis-full sm:basis-1/2 sm:pl-2"
            id="longitude"
            element="input"
            type="number"
            label="Longitude"
            errorText="Please enter a valid Longitude"
        />
        <div class="buttons">
            <Button :disabled="!formValid" type="submit" color="secondary">
                Edit Place
            </Button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { AxiosResponse } from "axios";
import { onMounted } from "vue";

import { Button, Input } from "@/components/form";
import { HttpError, LoadingSpinner } from "@/components/ui";
import {
    FormConfig,
    minLengthValidator,
    numericValidator,
    useForm,
    useHttp,
} from "@/lib";
import { Place } from "@/types";

// Init
const { httpData, sendRequest, clear } = useHttp();

// Props
const props = defineProps<{ placeId: string }>();

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

// Events
onMounted(() => {
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
            title: fields.title.value,
            address: fields.address.value,
            description: fields.description.value,
            location: {
                lat: fields.lat.value,
                lng: fields.lng.value,
            },
        });
    } catch (err) {
        console.log(err);
    }
};
</script>

<style lang="css">
@reference "../../main.css";

@layer components {
    .place-update {
        @apply flex flex-wrap;
        @apply relative w-[90%] max-w-160 my-0 mx-auto p-4;
        @apply list-none shadow-md rounded-md bg-surface;
    }

    .place-update .buttons {
        @apply w-full mt-10 text-right;
    }
}
</style>
