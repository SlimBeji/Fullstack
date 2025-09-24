<template>
    <HttpError
        v-if="httpData.error?.message"
        @close="clear"
        :error="httpData.error"
    />
    <div v-if="httpData.loading" class="center">
        <LoadingSpinner as-overlay />
    </div>
    <Modal @close="closeMapHandler" :show="showMap" :header="place.address">
        <Map :position="place.location" :zoom="13" :marker-text="place.title" />
        <template #footer>
            <Button inverse @click="closeMapHandler"> CLOSE </Button>
        </template>
    </Modal>
    <Modal
        @close="closeDeleteModalHandler"
        :show="showDeleteModal"
        header="Are you sure?"
    >
        <p class="delete-text-messaage">
            Do you want to proceed and delete this place?
        </p>
        <template #footer>
            <Button color="danger" @click="deleteHandler"> DELETE </Button>
            <Button @click="closeDeleteModalHandler">CANCEL</Button>
        </template>
    </Modal>
    <li class="place-item">
        <div class="card place-item-card">
            <div class="image-container">
                <img :src="imageUrl" :alt="place.title" />
            </div>
            <div class="place-info">
                <h2>{{ props.place.title }}</h2>
                <h2>{{ props.place.address }}</h2>
                <p>{{ props.place.description }}</p>
            </div>
            <div class="place-actions">
                <Button @click="openMapHandler" color="secondary" inverse>
                    VIEW ON MAP
                </Button>
                <Button v-if="isUserOwned" :to="`/places/${props.place.id}`"
                    >EDIT</Button
                >
                <Button
                    v-if="isUserOwned"
                    color="danger"
                    @click="openDeleteModalHandler"
                >
                    DELETE
                </Button>
            </div>
        </div>
    </li>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import placeholder from "@/assets/place_placeholder.jpg";
import { Button } from "@/components/form";
import { HttpError, LoadingSpinner, Map, Modal } from "@/components/ui";
import { useHttp } from "@/lib";
import { useAuthStore } from "@/store";
import type { Place } from "@/types";

// Init
const authStore = useAuthStore();
const { httpData, sendRequest, clear } = useHttp();

// Props
const props = defineProps<{
    place: Place;
}>();

// States
const showMap = ref<boolean>(false);
const showDeleteModal = ref<boolean>(false);

// Computed
const isUserOwned = computed(() => {
    return authStore?.userId === props.place.creatorId;
});

const imageUrl = computed(() => props.place.imageUrl || placeholder);

// Events
const emit = defineEmits<{
    (e: "delete"): void;
}>();

// Handlers
const openMapHandler = () => {
    showMap.value = true;
};

const closeMapHandler = () => {
    showMap.value = false;
};

const openDeleteModalHandler = () => {
    showDeleteModal.value = true;
};

const closeDeleteModalHandler = () => {
    showDeleteModal.value = false;
};

const deleteHandler = () => {
    closeDeleteModalHandler();
    sendRequest(`/places/${props.place.id}`, "delete").then(() => {
        emit("delete");
    });
};
</script>

<style lang="css">
@reference "../../main.css";

@layer components {
    .delete-text-messaage {
        @apply p-5;
    }

    li.place-item {
        @apply my-4;
    }

    .place-item-card {
        @apply p-0;
    }

    .place-item .image-container {
        @apply w-full h-52 md:h-80 mr-6;
    }

    .place-item-card img {
        @apply w-full h-full object-cover;
    }

    .place-item .place-info {
        @apply p-4 text-center;
    }

    .place-item .place-info h2,
    .place-item .place-info p {
        @apply mb-2;
    }

    .place-item .place-actions {
        @apply p-4 text-center border-t border-pen-ruler;
    }

    .place-item .place-actions button,
    .place-item .place-actions a {
        @apply mx-1;
    }
}
</style>
