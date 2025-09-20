<template>
    <HttpError
        v-if="httpData.error?.message"
        @close="clear"
        :error="httpData.error"
    />
    <LoadingSpinner v-else-if="httpData.loading" as-overlay />
    <form v-else @submit="submitHandler" class="place-update">
        <LoadingSpinner v-if="httpData.loading" as-overlay />
        <Input
            @update="inputHandlers.title"
            :validators="[minLengthValidator(10)]"
            :value="formState.inputs.title.val"
            :is-valid="formState.inputs.title.isValid"
            id="title"
            element="input"
            type="text"
            label="Title"
            errorText="Please enter a valid Title"
        />
        <Input
            @update="inputHandlers.address"
            :validators="[minLengthValidator(1)]"
            :value="formState.inputs.address.val"
            :is-valid="formState.inputs.address.isValid"
            id="address"
            element="input"
            type="text"
            label="Address"
            errorText="Please enter a valid address"
        />
        <Input
            @update="inputHandlers.description"
            :validators="[minLengthValidator(10)]"
            :value="formState.inputs.description.val"
            :is-valid="formState.inputs.description.isValid"
            id="description"
            element="textarea"
            label="Description"
            errorText="Please enter a valid Description"
        />
        <Input
            @update="inputHandlers.lat"
            :validators="[numericValidator()]"
            :value="formState.inputs.lat.val"
            :is-valid="formState.inputs.lat.isValid"
            id="latitude"
            width="1/2"
            padding="pr-1"
            element="input"
            label="Latitude"
            errorText="Please enter a valid Latitude"
        />
        <Input
            @update="inputHandlers.lng"
            :validators="[numericValidator()]"
            :value="formState.inputs.lng.val"
            :is-valid="formState.inputs.lng.isValid"
            id="longitude"
            width="1/2"
            padding="pl-1"
            element="input"
            label="Longitude"
            errorText="Please enter a valid Longitude"
        />
        <div class="buttons">
            <Button
                :disabled="!formState.isValid"
                type="submit"
                color="secondary"
            >
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
    emptyStateBuilder,
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
const Form = {
    title: true,
    address: true,
    description: true,
    lat: true,
    lng: true,
};

type FormFields = keyof typeof Form;

const initialState = emptyStateBuilder<FormFields>(Form);
const { formState, inputHandlers, setFormData } =
    useForm<FormFields>(initialState);

// Events
onMounted(() => {
    sendRequest(`/places/${props.placeId}`, "get").then(
        (resp: AxiosResponse<Place>) => {
            const { data } = resp;
            setFormData({
                title: { val: data.title, isValid: true },
                address: { val: data.address, isValid: true },
                description: { val: data.description, isValid: true },
                lat: { val: String(data.location.lat), isValid: true },
                lng: { val: String(data.location.lng), isValid: true },
            });
        }
    );
});

// Handlers
const submitHandler = async (e: Event) => {
    e.preventDefault();
    try {
        await sendRequest(`/places/${props.placeId}`, "put", {
            title: formState.inputs.title.val,
            address: formState.inputs.address.val,
            description: formState.inputs.description.val,
            location: {
                lat: formState.inputs.lat.val,
                lng: formState.inputs.lng.val,
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
