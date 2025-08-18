import "./Auth.css";

import { useMemo, useState } from "react";

import { Button, ImageUpload, Input } from "../components/form";
import { Card, HttpError, LoadingSpinner } from "../components/ui";
import { emptyStateBuilder, useForm, useHttp } from "../hooks";
import { authSlice, useAppDispatch } from "../states";
import { EncodedUserToken } from "../types";
import { emailValidator, minLengthValidator } from "../util";

const AuthForm = {
    username: false,
    image: false,
    email: true,
    password: true,
};

type AuthFormTypes = keyof typeof AuthForm;

const emptyState = emptyStateBuilder<AuthFormTypes>(AuthForm);

const Auth: React.FC = () => {
    const dispatch = useAppDispatch();

    const [data, sendRequest, clearError] = useHttp();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [state, inputHandlers, , fieldsActivationHandler] =
        useForm<AuthFormTypes>(emptyState);

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
        const resp = await sendRequest(
            "/auth/signin",
            "post",
            {
                username: state.inputs.email.val,
                password: state.inputs.password.val,
            },
            false
        );
        const data = resp.data as EncodedUserToken;
        dispatch(authSlice.actions.login(data));
    };

    const onSignup = async (): Promise<void> => {
        const formData = new FormData();
        formData.append("name", state.inputs.username.val);
        formData.append("image", state.inputs.image.val.file);
        formData.append("email", state.inputs.email.val);
        formData.append("password", state.inputs.password.val);
        const resp = await sendRequest("/auth/signup", "post", formData, false);
        const data = resp.data as EncodedUserToken;
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
            <Card className="authentication">
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
                    <Button type="submit" disabled={!state.isValid}>
                        {verb}
                    </Button>
                </form>
                <Button inverse onClick={onSwitchModeHandler}>
                    {switchText}
                </Button>
            </Card>
        </div>
    );
};

export default Auth;
