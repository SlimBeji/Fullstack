<script lang="ts">
import { Button, ImageUpload, Input } from "@/components/form";
import { HttpError, LoadingSpinner } from "@/components/ui";
import type { FormConfig } from "@/lib";
import { emailValidator, minLengthValidator, useForm, useHttp } from "@/lib";
import { authStore } from "@/store";
import type { SigninResponse } from "@/types";

// Init
const { httpData, sendRequest, clear } = useHttp();

// Form
const AuthFormConfig: FormConfig = {
    username: { active: false, validators: [minLengthValidator(8)] },
    image: { active: false, initial: { file: null, url: "" } },
    email: { validators: [emailValidator()] },
    password: { validators: [minLengthValidator(10)] },
};

type FieldsType = keyof typeof AuthFormConfig;

const { fields, formValid, updateFieldConfig } =
    useForm<FieldsType>(AuthFormConfig);
const { username, image, email, password } = fields;

// States
let isLoginMode = $state<boolean>(true);

// Computed
const text = $derived(
    isLoginMode
        ? {
              verb: "Authenticate",
              requiredText: "Login Required",
              switchText: "Switch to signup",
          }
        : {
              verb: "Register",
              requiredText: "Registration Required",
              switchText: "Swith to login",
          }
);

// Handlers
const onSignin = async (): Promise<void> => {
    const formData = new FormData();
    formData.append("username", $email.value);
    formData.append("password", $password.value);
    const resp = await sendRequest("/auth/signin", "post", formData, false);
    const data = resp.data as SigninResponse;
    authStore.login(data);
};

const onSignup = async (): Promise<void> => {
    const formData = new FormData();
    formData.append("name", $username.value);
    formData.append("image", $image.value.file);
    formData.append("email", $email.value);
    formData.append("password", $password.value);
    const resp = await sendRequest("/auth/signup", "post", formData, false);
    const data = resp.data as SigninResponse;
    authStore.login(data);
};

const onSubmit = (e: Event): void => {
    e.preventDefault();
    if (isLoginMode) {
        onSignin();
    } else {
        onSignup();
    }
};

const onSwitchModeHandler = () => {
    // if prev === true ==> We were in Login Mode
    // username and image were disabled (false)
    // Switching to Signup Mode, we want to
    // enable them so we send prev (true)
    // Same reasoning if we were in Signup Mode
    const prev = isLoginMode;
    updateFieldConfig({ username: { active: prev }, image: { active: prev } });
    isLoginMode = !prev;
};
</script>

<div class="center">
    {#if $httpData.error?.message}
        <HttpError
            onClose={clear}
            error={$httpData.error}
            header="Credentials not valid!"
        />
    {/if}
    <div class="auth-form">
        {#if $httpData.loading}
            <LoadingSpinner asOverlay />
        {/if}
        <h2>{text.requiredText}</h2>
        <hr />
        <form onsubmit={onSubmit}>
            {#if !isLoginMode}
                <Input
                    bind:value={$username.value}
                    bind:valid={$username.valid}
                    element="input"
                    id="username"
                    label="Username"
                    type="text"
                    errorText="Please enter a valid username of at least 8 characters"
                />
                <ImageUpload
                    bind:value={$image.value}
                    bind:valid={$image.valid}
                    id="image"
                    color="secondary"
                    buttonText="Upload your Avatar"
                    errorText="Please upload a valid image"
                />
            {/if}
            <Input
                bind:value={$email.value}
                bind:valid={$email.valid}
                element="input"
                id="email"
                label="E-mail"
                type="email"
                errorText="Please enter a valid email"
            />
            <Input
                bind:value={$password.value}
                bind:valid={$password.valid}
                element="input"
                id="password"
                label="Password"
                type="password"
                errorText="Please enter a password with at least 10 characters"
            />
            <div class="buttons">
                <Button
                    class="auth-button"
                    disabled={!$formValid}
                    color="secondary"
                    type="submit"
                >
                    {text.verb}
                </Button>
                <Button
                    class="auth-button"
                    onClick={onSwitchModeHandler}
                    type="button"
                    color="secondary"
                    inverse
                >
                    {text.switchText}
                </Button>
            </div>
        </form>
    </div>
</div>

<style lang="css">
@reference "@/main.css";

.auth-form {
    @apply w-[90%] max-w-md mx-auto mt-10 p-6;
    @apply text-center shadow-lg rounded-xl bg-surface;
}

.auth-form > h2 {
    @apply text-2xl font-bold text-pen mb-2;
}

.auth-form > hr {
    @apply border-t-2 border-secondary w-[100%] mb-6;
}

.auth-form .buttons {
    @apply flex justify-center space-x-4;
}

.auth-form .buttons :global(.auth-button) {
    @apply min-w-40;
}
</style>
