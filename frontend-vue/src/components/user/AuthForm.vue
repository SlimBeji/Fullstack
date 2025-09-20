<template>
    <div class="center">
        <HttpError
            v-if="httpData.error?.message"
            @close="clear"
            :error="httpData.error"
            header="Credentials not valid!"
        />
        <div class="auth-form">
            <LoadingSpinner v-if="httpData.loading" as-overlay />
            <h2>{{ text.requiredText }}</h2>
            <hr />
            <form @submit="onSubmit">
                <Input
                    v-if="!isLoginMode"
                    @update="inputHandlers.username"
                    :validators="[minLengthValidator(8)]"
                    element="input"
                    id="username"
                    label="Username"
                    type="text"
                    errorText="Please enter a valid username of at least 8 characters"
                />
                <ImageUpload
                    v-if="!isLoginMode"
                    @upload="inputHandlers.image"
                    :file="formState.inputs.image.val.file"
                    :url="formState.inputs.image.val.url"
                    id="image"
                    color="secondary"
                />
                <Input
                    @update="inputHandlers.email"
                    :validators="[emailValidator()]"
                    element="input"
                    id="email"
                    label="E-mail"
                    type="email"
                    errorText="Please enter a valid email"
                />
                <Input
                    @update="inputHandlers.password"
                    :validators="[minLengthValidator(10)]"
                    element="input"
                    id="password"
                    label="Password"
                    type="password"
                    errorText="Please enter a password with at least 10 characters"
                />
                <div class="buttons">
                    <Button
                        :disabled="!formState.isValid"
                        color="secondary"
                        type="submit"
                    >
                        {{ text.verb }}
                    </Button>
                    <Button
                        @click="onSwitchModeHandler"
                        type="button"
                        color="secondary"
                        inverse
                    >
                        {{ text.switchText }}
                    </Button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { Button, ImageUpload, Input } from "@/components/form";
import { HttpError, LoadingSpinner } from "@/components/ui";
import {
    emailValidator,
    emptyStateBuilder,
    minLengthValidator,
    useForm,
    useHttp,
} from "@/lib";
import { useAuthStore } from "@/stores";
import { SigninResponse } from "@/types";

// Init
const authStore = useAuthStore();
const { httpData, sendRequest, clear } = useHttp();

// States
const isLoginMode = ref<boolean>(true);

// Form
const AuthFormData = {
    username: false,
    image: false,
    email: true,
    password: true,
};

type AuthFormTypes = keyof typeof AuthFormData;

const emptyState = emptyStateBuilder<AuthFormTypes>(AuthFormData);
emptyState.inputs.image.val = { file: null, url: "" };
const { formState, inputHandlers, fieldsActivationHandler } =
    useForm<AuthFormTypes>(emptyState);

// Computed
const text = computed(() => {
    if (isLoginMode.value) {
        return {
            verb: "Authenticate",
            requiredText: "Login Required",
            switchText: "Switch to signup",
        };
    } else {
        return {
            verb: "Register",
            requiredText: "Registration Required",
            switchText: "Swith to login",
        };
    }
});

// Handlers
const onSignin = async (): Promise<void> => {
    const formData = new FormData();
    formData.append("username", formState.inputs.email.val);
    formData.append("password", formState.inputs.password.val);
    const resp = await sendRequest("/auth/signin", "post", formData, false);
    const data = resp.data as SigninResponse;
    authStore.login(data);
};

const onSignup = async (): Promise<void> => {
    const formData = new FormData();
    formData.append("name", formState.inputs.username.val);
    formData.append("image", formState.inputs.image.val.file);
    formData.append("email", formState.inputs.email.val);
    formData.append("password", formState.inputs.password.val);
    const resp = await sendRequest("/auth/signup", "post", formData, false);
    const data = resp.data as SigninResponse;
    authStore.login(data);
};

const onSubmit = (e: Event): void => {
    e.preventDefault();
    if (isLoginMode.value) {
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
    const prev = isLoginMode.value;
    fieldsActivationHandler({
        username: prev,
        image: prev,
    });
    isLoginMode.value = !prev;
};
</script>

<style lang="css">
@reference "../../main.css";

@layer components {
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

    .auth-form .button {
        @apply min-w-40;
    }
}
</style>
