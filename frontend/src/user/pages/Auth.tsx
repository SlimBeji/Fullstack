import "./Auth.css";

import { useState, useContext } from "react";

import { AuthContext } from "../../shared/context";
import { useForm, emptyStateBuilder, useHttp } from "../../shared/hooks";
import { Card, ErrorModal, LoadingSpinner } from "../../shared/components/ui";
import { Input, Button } from "../../shared/components/form";

import {
    emailValidator,
    minLengthValidator,
    minValidator,
} from "../../shared/util/validators";

const AuthForm = {
    username: false,
    email: true,
    password: true,
};

type AuthFormTypes = keyof typeof AuthForm;

const emptyState = emptyStateBuilder<AuthFormTypes>(AuthForm);

const Auth: React.FC = () => {
    const auth = useContext(AuthContext);
    const [data, sendRequest, clearError] = useHttp();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [state, inputHandlers, _, fieldsActivationHandler] =
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
        await sendRequest("/auth/signin", "post", {
            email: state.inputs.email.val,
            password: state.inputs.password.val,
        });
        auth.login();
    };

    const onSignup = async (): Promise<void> => {
        await sendRequest("/auth/signup", "post", {
            name: state.inputs.username.val,
            email: state.inputs.email.val,
            password: state.inputs.password.val,
        });
        auth.login();
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
            });
            return !prev;
        });
    };

    return (
        <>
            {data.error?.message && (
                <ErrorModal
                    header="Credentials not valid!"
                    error={data.error?.message}
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
                            validators={[minValidator(8)]}
                            errorText="Please enter a valid username of at least 8 characters"
                            value={state.inputs.username.val || ""}
                        />
                    )}
                    <Input
                        onInput={inputHandlers.email}
                        element="input"
                        id="email"
                        type="email"
                        label="E-Mail"
                        validators={[emailValidator()]}
                        errorText="Please enter a valid email"
                    />
                    <Input
                        onInput={inputHandlers.password}
                        element="input"
                        id="password"
                        type="password"
                        label="Password"
                        validators={[minLengthValidator(10)]}
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
        </>
    );
};

export default Auth;
