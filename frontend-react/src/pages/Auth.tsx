import { useMemo, useState } from "react";

import { Button, ImageUpload, Input } from "../components/form";
import { HttpError, LoadingSpinner } from "../components/ui";
import { AuthForm } from "../components/user";
import { emptyStateBuilder, useForm, useHttp } from "../hooks";
import { authSlice, useAppDispatch } from "../states";
import { SigninResponse } from "../types";
import { emailValidator, minLengthValidator } from "../util";

const AuthFormData = {
    username: false,
    image: false,
    email: true,
    password: true,
};

type AuthFormTypes = keyof typeof AuthFormData;

const emptyState = emptyStateBuilder<AuthFormTypes>(AuthFormData);

const Auth: React.FC = () => {
    const dispatch = useAppDispatch();

    const [data, sendRequest, clearError] = useHttp();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [state, inputHandlers, , fieldsActivationHandler] =
        useForm<AuthFormTypes>(emptyState);

    // Text to display depending if Signin form or Signup form
    let verb: "Authenticate" | "Register";
    let requiredText: "Login Required" | "Registration Required";
    let switchText: "Swith to login" | "Switch to signup";
    if (isLoginMode) {
        verb = "Authenticate";
        requiredText = "Login Required";
        switchText = "Switch to signup";
    } else {
        verb = "Register";
        requiredText = "Registration Required";
        switchText = "Swith to login";
    }

    const onSignin = async (): Promise<void> => {
        const formData = new FormData();
        formData.append("username", state.inputs.email.val);
        formData.append("password", state.inputs.password.val);
        const resp = await sendRequest("/auth/signin", "post", formData, false);
        const data = resp.data as SigninResponse;
        dispatch(authSlice.actions.login(data));
    };

    const onSignup = async (): Promise<void> => {
        const formData = new FormData();
        formData.append("name", state.inputs.username.val);
        formData.append("image", state.inputs.image.val.file);
        formData.append("email", state.inputs.email.val);
        formData.append("password", state.inputs.password.val);
        const resp = await sendRequest("/auth/signup", "post", formData, false);
        const data = resp.data as SigninResponse;
        dispatch(authSlice.actions.login(data));
    };

    const onSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (isLoginMode) {
            onSignin();
        } else {
            onSignup();
        }
    };

    const onSwitchModeHandler = () => {
        setIsLoginMode((prev: boolean) => {
            // if prev === true ==> We were in Login Mode
            // username and image were disabled (false)
            // Switching to Signup Mode, we want to
            // enable them so we send prev (true)
            // Same reasoning if we were in Signup Mode
            fieldsActivationHandler({
                username: prev,
                image: prev,
            });
            return !prev;
        });
    };

    const usernameValidators = useMemo(() => [minLengthValidator(8)], []);
    const emailValidators = useMemo(() => [emailValidator()], []);
    const passwordValidators = useMemo(() => [minLengthValidator(10)], []);

    return (
        <div className="center">
            {data.error?.message && (
                <HttpError
                    header="Credentials not valid!"
                    error={data.error}
                    onClear={() => clearError()}
                />
            )}
            <AuthForm>
                {data.loading && <LoadingSpinner asOverlay />}
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {requiredText}
                </h2>
                <hr className="border-t-2 border-pink-500 w-[100%] mb-6" />
                <form onSubmit={onSubmit}>
                    {!isLoginMode && (
                        <Input
                            onInput={inputHandlers.username}
                            element="input"
                            id="username"
                            type="text"
                            label="Username"
                            validators={usernameValidators}
                            errorText="Please enter a valid username of at least 8 characters"
                            value={state.inputs.username.val || ""}
                        />
                    )}
                    {!isLoginMode && (
                        <ImageUpload
                            id="image"
                            onInput={inputHandlers.image}
                            val={state.inputs.image.val}
                        />
                    )}
                    <Input
                        onInput={inputHandlers.email}
                        element="input"
                        id="email"
                        type="email"
                        label="E-Mail"
                        validators={emailValidators}
                        errorText="Please enter a valid email"
                    />
                    <Input
                        onInput={inputHandlers.password}
                        element="input"
                        id="password"
                        type="password"
                        label="Password"
                        validators={passwordValidators}
                        errorText="Please enter a password with at least 10 characters"
                    />
                    <div className="flex justify-center space-x-4">
                        <Button
                            className={`min-w-40 ${state.isValid ? "" : "btn-disabled"}`}
                            type="submit"
                        >
                            {verb}
                        </Button>
                        <Button
                            type="button"
                            className="min-w-40 btn-inverse"
                            onClick={onSwitchModeHandler}
                        >
                            {switchText}
                        </Button>
                    </div>
                </form>
            </AuthForm>
        </div>
    );
};

export default Auth;
