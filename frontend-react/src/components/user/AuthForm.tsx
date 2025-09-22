import { useState } from "react";

import {
    emailValidator,
    FormConfig,
    minLengthValidator,
    useForm,
    useHttp,
} from "../../lib";
import { authSlice, useAppDispatch } from "../../store";
import { SigninResponse } from "../../types";
import { Button, ImageUpload, Input } from "../form";
import { HttpError, LoadingSpinner } from "../ui";

const AuthFormConfig: FormConfig = {
    username: { active: false, validators: [minLengthValidator(8)] },
    image: { active: false, initial: { file: null, url: "" } },
    email: { validators: [emailValidator()] },
    password: { validators: [minLengthValidator(10)] },
};

type FieldsType = keyof typeof AuthFormConfig;

const AuthForm: React.FC = () => {
    const dispatch = useAppDispatch();

    const [data, sendRequest, clearError] = useHttp();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [state, inputHandlers, , updateFieldConfig] =
        useForm<FieldsType>(AuthFormConfig);

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
        formData.append("username", state.fields.email.value);
        formData.append("password", state.fields.password.value);
        const resp = await sendRequest("/auth/signin", "post", formData, false);
        const data = resp.data as SigninResponse;
        dispatch(authSlice.actions.login(data));
    };

    const onSignup = async (): Promise<void> => {
        const formData = new FormData();
        formData.append("name", state.fields.username.value);
        formData.append("image", state.fields.image.value.file);
        formData.append("email", state.fields.email.value);
        formData.append("password", state.fields.password.value);
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
            updateFieldConfig({
                username: { active: prev },
                image: { active: prev },
            });
            return !prev;
        });
    };

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
                            value={state.fields.username.value}
                            isValid={state.fields.username.valid}
                            element="input"
                            id="username"
                            type="text"
                            label="Username"
                            errorText="Please enter a valid username of at least 8 characters"
                        />
                    )}
                    {!isLoginMode && (
                        <ImageUpload
                            onInput={inputHandlers.image}
                            value={state.fields.image.value}
                            isValid={state.fields.image.valid}
                            id="image"
                            buttonText="Upload your Avatar"
                            color="secondary"
                            errorText="Please upload a valid image"
                        />
                    )}
                    <Input
                        onInput={inputHandlers.email}
                        value={state.fields.email.value}
                        isValid={state.fields.email.valid}
                        element="input"
                        id="email"
                        type="email"
                        label="E-Mail"
                        errorText="Please enter a valid email"
                    />
                    <Input
                        onInput={inputHandlers.password}
                        value={state.fields.password.value}
                        isValid={state.fields.password.valid}
                        element="input"
                        id="password"
                        type="password"
                        label="Password"
                        errorText="Please enter a password with at least 10 characters"
                    />
                    <div className="buttons">
                        <Button
                            color="secondary"
                            disabled={!state.valid}
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
