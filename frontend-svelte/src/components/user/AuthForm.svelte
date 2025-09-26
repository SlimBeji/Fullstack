<script lang="ts">
import { LoadingSpinner, Modal } from "@/components/ui";
import { useForm, useHttp } from "@/lib";
import { minLengthValidator } from "@/lib";
import { authStore } from "@/store";
import type { SigninResponse } from "@/types";

// Testing useHttp
const { httpData, sendRequest, clear } = useHttp();

async function load() {
    await sendRequest("/api/hello-world", "get", undefined, false);
}
const userId = authStore.userId;
const login = () => {
    const resp: SigninResponse = {
        access_token: "token",
        token_type: "bearer",
        userId: "u123",
        email: "mslimbeji@gmail.com",
        expires_in: 123333,
    };
    authStore.login(resp);
};
const logout = () => {
    authStore.logout();
};

// Testing useForm
const FormConfig = {
    firstname: { validators: [minLengthValidator(5)] },
    lastname: { validators: [minLengthValidator(5)] },
};

type FormTypes = keyof typeof FormConfig;
const { fields, formValid } = useForm<FormTypes>(FormConfig);
const { firstname, lastname } = fields;

let modalOpen = $state<boolean>(false);
const openModal = () => {
    modalOpen = true;
};
const closeModal = () => {
    modalOpen = false;
};
</script>

<button onclick={openModal}>Open Modal</button>
<Modal
    style="background:red"
    show={modalOpen}
    onClose={closeModal}
    header="Testing the modal"
>
    <p>Content inside the Modal</p>
    {#snippet footer()}
        <button onclick={closeModal}>Close</button>
    {/snippet}
</Modal>

<LoadingSpinner />
<h1>Authentication Page</h1>
<p>
    Welcome User {$userId}
</p>
<button class="test" onclick={login}>Login</button>
<button class="test" onclick={logout}>Logout</button>

<hr />
<button class="test" onclick={load}>Load</button>
<button class="test" onclick={clear}>Clear</button>

{#if $httpData.loading}
    <p>Loading...</p>
{:else if $httpData.error}
    <p>Error: {$httpData.error.message}</p>
{:else if $httpData.json}
    <pre>{JSON.stringify($httpData.json, null, 2)}</pre>
{:else}
    <p>Nothing to show</p>
{/if}

<form>
    <div>
        <label>Firstname <input bind:value={$firstname.value} /></label>
    </div>
    <div>
        <label>Lastname <input bind:value={$lastname.value} /></label>
    </div>
</form>
<p>Validity: <span>{$formValid}</span></p>

<style lang="css">
@reference "@/main.css";

button {
    @apply bg-red-500 border border-black;
}
</style>
