<script lang="ts">
import placeholder from "@/assets/place_placeholder.jpg";
import { Button } from "@/components/form";
import { HttpError, LoadingSpinner, Modal } from "@/components/ui";
import { useHttp } from "@/lib";
import { authStore } from "@/store";
import type { Place } from "@/types";

// Init
const loggedUserId = authStore.userId;
const { httpData, sendRequest, clear } = useHttp();

// Props
const props = $props<{
    place: Place;
    onDelete: () => void;
}>();

// States
let showMap = $state<boolean>(false);
let showDeleteModal = $state<boolean>(false);

// Computed
const isUserOwned = $derived<boolean>($loggedUserId === props.place.creatorId);
const imageUrl = $derived(props.place.imageUrl || placeholder);

// Handlers
const openMapHandler = () => {
    showMap = true;
};

const closeMapHandler = () => {
    showMap = false;
};

const openDeleteModalHandler = () => {
    showDeleteModal = true;
};

const closeDeleteModalHandler = () => {
    showDeleteModal = false;
};

const deleteHandler = () => {
    closeDeleteModalHandler();
    sendRequest(`/places/${props.place.id}`, "delete").then(() => {
        props.onDelete();
    });
};
</script>

{#if $httpData.error?.message}
    <HttpError onClose={clear} error={$httpData.error} />
{/if}
{#if $httpData.loading}
    <LoadingSpinner asOverlay />
{/if}
<Modal onClose={closeMapHandler} show={showMap} header={props.place.address}>
    <p>Map placeholder</p>
    {#snippet footer()}
        <Button inverse onClick={closeMapHandler}>CLOSE</Button>
    {/snippet}
</Modal>
<Modal
    onClose={closeDeleteModalHandler}
    show={showDeleteModal}
    header="Are you sure?"
>
    <p class="delete-text-messaage">
        Do you want to proceed and delete this place?
    </p>
    {#snippet footer()}
        <Button color="danger" onClick={deleteHandler}>DELETE</Button>
        <Button onClick={closeDeleteModalHandler}>CANCEL</Button>
    {/snippet}
</Modal>
<li class="place-item">
    <div class="card place-item-card">
        <div class="image-container">
            <img src={imageUrl} alt={props.place.title} />
        </div>
        <div class="place-info">
            <h2>{props.place.title}</h2>
            <h2>{props.place.address}</h2>
            <p>{props.place.description}</p>
        </div>
        <div class="place-actions">
            <Button onClick={openMapHandler} color="secondary" inverse>
                VIEW ON MAP
            </Button>
            <Button to={`/places/${props.place.id}`}>EDIT</Button>
            {#if isUserOwned}
                <Button color="danger" onClick={openDeleteModalHandler}>
                    DELETE
                </Button>
            {/if}
        </div>
    </div>
</li>

<style lang="css">
@reference "@/main.css";

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

.place-item .place-actions :global(.btn){
    @apply mx-1;
}
</style>
