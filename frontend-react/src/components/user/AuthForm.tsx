import { useMemo, useState } from "react";

import {
    emailValidator,
    emptyStateBuilder,
    minLengthValidator,
    useForm,
    useHttp,
} from "../../lib";
import { authSlice, useAppDispatch } from "../../store";
import { SigninResponse } from "../../types";
import { Button, ImageUpload, Input } from "../form";
import { HttpError, LoadingSpinner } from "../ui";

const AuthFormData = {
    username: false,
    image: false,
    email: true,
    password: true,
};

type AuthFormTypes = keyof typeof AuthFormData;

const emptyState = emptyStateBuilder<AuthFormTypes>(AuthFormData);

const AuthForm: React.FC = () => {
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
            <div className="auth-form">
                {data.loading && <LoadingSpinner asOverlay />}
                <h2>{requiredText}</h2>
                <hr />
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
                        />
                    )}
                    {!isLoginMode && (
                        <ImageUpload
                            id="image"
                            color="secondary"
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
                    <div className="buttons">
                        <Button
                            color="secondary"
                            disabled={!state.isValid}
                            type="submit"
                        >
                            {verb}
                        </Button>
                        <Button
                            type="button"
                            color="secondary"
                            inverse
                            onClick={onSwitchModeHandler}
                        >
                            {switchText}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthForm;
