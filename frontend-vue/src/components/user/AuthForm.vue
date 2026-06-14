<template>
    <div>
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
                    v-model="fields.username.value"
                    :is-valid="fields.username.valid"
                    element="input"
                    id="username"
                    label="Username"
                    type="text"
                    errorText="Please enter a valid username of at least 8 characters"
                />
                <ImageUpload
                    v-if="!isLoginMode"
                    v-model="fields.image.value"
                    :is-valid="fields.image.valid"
                    id="image"
                    color="secondary"
                    button-text="Upload your Avatar"
                    errorText="Please upload a valid image"
                />
                <Input
                    v-model="fields.email.value"
                    :is-valid="fields.email.valid"
                    element="input"
                    id="email"
                    label="E-mail"
                    type="email"
                    errorText="Please enter a valid email"
                />
                <Input
                    v-model="fields.password.value"
                    :is-valid="fields.password.valid"
                    element="input"
                    id="password"
                    label="Password"
                    type="password"
                    errorText="Please enter a password with at least 10 characters"
                />
                <div class="buttons">
                    <Button
                        :disabled="!formValid"
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
import type { FormConfig } from "@/composables";
import { useBackend, useForm } from "@/composables";
import { useAuthStore } from "@/store";
import type { SigninResponse } from "@/types";
import { emailValidator, minLengthValidator } from "@/utils";

// Init
const authStore = useAuthStore();
const { httpData, sendRequest, clear } = useBackend();

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

// States
const isLoginMode = ref<boolean>(true);

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
    // use URLSearchParams for application/x-www-form-urlencoded
    const body = new URLSearchParams();
    body.append("username", fields.email.value);
    body.append("password", fields.password.value);
    const resp = await sendRequest<SigninResponse>(
        "/auth/signin",
        "post",
        body,
        false
    );
    authStore.login(resp.data);
};

const onSignup = async (): Promise<void> => {
    // use FormData for multipart/form-data
    const formData = new FormData();
    formData.append("name", fields.username.value);
    formData.append("email", fields.email.value);
    formData.append("password", fields.password.value);
    if (fields.image.value.file) {
        formData.append("image", fields.image.value.file);
    }
    const resp = await sendRequest<SigninResponse>(
        "/auth/signup",
        "post",
        formData,
        false
    );
    authStore.login(resp.data);
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
    updateFieldConfig({ username: { active: prev }, image: { active: prev } });
    isLoginMode.value = !prev;
};
</script>

<style scoped lang="css">
@reference "@/main.css";

.auth-form {
    @apply w-[90%] max-w-md mx-auto mt-10 p-6;
    @apply text-center shadow-lg rounded-xl bg-surface;
}

.auth-form > h2 {
    @apply text-2xl font-bold text-pen mb-2;
}

.auth-form > hr {
    @apply border-t-2 border-secondary w-full mb-6;
}

.auth-form .buttons {
    @apply flex justify-center gap-4;
}

.auth-form button {
    @apply min-w-40;
}
</style>
