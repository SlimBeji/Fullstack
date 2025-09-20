<template>
    <HttpError
        v-if="httpData.error?.message"
        @close="clear"
        :error="httpData.error"
    />
    <form @submit="submitHandler" class="place-create">
        <LoadingSpinner v-if="httpData.loading" as-overlay />
        <Input
            @update="inputHandlers.title"
            :validators="[minLengthValidator(10)]"
            id="title"
            element="input"
            type="text"
            label="Title"
            errorText="Please enter a valid Title"
        />
        <Input
            @update="inputHandlers.address"
            :validators="[minLengthValidator(1)]"
            id="address"
            element="input"
            type="text"
            label="Address"
            errorText="Please enter a valid address"
        />
        <Input
            @update="inputHandlers.description"
            :validators="[minLengthValidator(10)]"
            id="description"
            element="textarea"
            label="Description"
            errorText="Please enter a valid Description"
        />
        <Input
            @update="inputHandlers.lat"
            :validators="[numericValidator()]"
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
            id="longitude"
            width="1/2"
            padding="pl-1"
            element="input"
            label="Longitude"
            errorText="Please enter a valid Longitude"
        />
        <ImageUpload
            @upload="inputHandlers.image"
            id="image"
            color="secondary"
            required
        />
        <div class="buttons">
            <Button
                :disabled="!formState.isValid"
                type="submit"
                color="secondary"
            >
                Add Place
            </Button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { Button, ImageUpload, Input } from "@/components/form";
import { HttpError, LoadingSpinner } from "@/components/ui";
import {
    emptyStateBuilder,
    minLengthValidator,
    numericValidator,
    useForm,
    useHttp,
} from "@/lib";
import router from "@/router";
import { useAuthStore } from "@/stores";

// Init
const authStore = useAuthStore();
const { httpData, sendRequest, clear } = useHttp();

// Form
const Form = {
    title: true,
    address: true,
    description: true,
    lat: true,
    lng: true,
    image: true,
};

type FormFields = keyof typeof Form;

const initialState = emptyStateBuilder<FormFields>(Form);
const { formState, inputHandlers } = useForm<FormFields>(initialState);

// Handlers
const submitHandler = async (e: Event) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", formState.inputs.title.val);
    formData.append("image", formState.inputs.image.val.file);
    formData.append("description", formState.inputs.description.val);
    formData.append("address", formState.inputs.address.val);
    formData.append(
        "location",
        JSON.stringify({
            lat: formState.inputs.lat.val,
            lng: formState.inputs.lng.val,
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
@reference "../../main.css";

@layer components {
    .place-create {
        @apply flex flex-wrap;
        @apply relative w-[90%] max-w-160 my-0 mx-auto p-4;
        @apply list-none shadow-md rounded-md bg-surface;
    }

    .place-create .buttons {
        @apply w-full mt-10 text-right;
    }
}
</style>
