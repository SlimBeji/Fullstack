<template>
    <HttpError
        v-if="httpData.error?.message"
        @close="clear"
        :error="httpData.error"
    />
    <LoadingSpinner v-if="httpData.loading" as-overlay />
    <form v-else @submit="submitHandler" class="place-create">
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
        <ImageUpload
            v-model="fields.image.value"
            :is-valid="fields.image.valid"
            id="image"
            color="secondary"
        />
        <div class="buttons">
            <Button :disabled="!formValid" type="submit" color="secondary">
                Add Place
            </Button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { Button, ImageUpload, Input } from "@/components/form";
import { HttpError, LoadingSpinner } from "@/components/ui";
import type { FormConfig } from "@/lib";
import { minLengthValidator, numericValidator, useForm, useHttp } from "@/lib";
import router from "@/router";
import { useAuthStore } from "@/store";

// Init
const authStore = useAuthStore();
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

// Handlers
const submitHandler = async (e: Event) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", fields.title.value);
    formData.append("image", fields.image.value.file);
    formData.append("description", fields.description.value);
    formData.append("address", fields.address.value);
    formData.append(
        "location",
        JSON.stringify({
            lat: fields.lat.value,
            lng: fields.lng.value,
        })
    );
    formData.append("creatorId", authStore.userId || "");
    try {
        await sendRequest("/places/", "post", formData);
        router.push("/");
    } catch (err) {
        console.log(err);
    }
};
</script>

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
