<script lang="ts">
    import { useForm, useHttp } from "@/lib";
    import { minLengthValidator } from "@/lib";
    import { authStore } from "@/store";
    import type { SigninResponse } from "@/types";

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

    const FormConfig = {
        firstname: { validators: [minLengthValidator(5)] },
        lastname: { validators: [minLengthValidator(5)] },
    };

    type FormTypes = keyof typeof FormConfig;
    const { fields, formValid } = useForm<FormTypes>(FormConfig);
    const { firstname, lastname } = fields;
</script>

<main>
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
</main>

<style lang="css">
    @reference "./main.css";

    button {
        @apply bg-red-500 border border-black;
    }
</style>
