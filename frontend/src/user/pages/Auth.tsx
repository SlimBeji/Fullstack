import "./Auth.css";

import { useState, useContext } from "react";

import { AuthContext } from "../../shared/context";
import { useForm, emptyStateBuilder } from "../../shared/hooks/form";
import { Card, ErrorModal, LoadingSpinner } from "../../shared/components/ui";
import { Input, Button } from "../../shared/components/form";

import {
    emailValidator,
    minLengthValidator,
    minValidator,
} from "../../shared/util/validators";
import { backendApi } from "../../shared/util/axios";
import { AxiosError, HttpStatusCode } from "axios";

const AuthForm = {
    username: false,
    email: true,
    password: true,
};

type AuthFormTypes = keyof typeof AuthForm;

const emptyState = emptyStateBuilder<AuthFormTypes>(AuthForm);

const Auth: React.FC = () => {
    const auth = useContext(AuthContext);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
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

    const onSignin = (): void => {
        backendApi
            .post("/auth/signin", {
                name: state.inputs.username.val,
                password: state.inputs.password.val,
            })
            .then(() => {
                auth.login();
            })
            .catch((err) => {
                errorHandler(err);
            });
    };

    const onSignup = (): void => {
        backendApi
            .post("/auth/signup", {
                name: state.inputs.username.val,
                email: state.inputs.email.val,
                password: state.inputs.password.val,
            })
            .then(() => {
                auth.login();
            })
            .catch((err) => {
                errorHandler(err);
            });
    };

    const errorHandler = (err: Error) => {
        const defaultMessage = "Something went wrong!";
        if (err instanceof AxiosError) {
            const message = err.response?.data?.message;
            setErrorMessage(message || defaultMessage);
        } else {
            setErrorMessage(err.message || defaultMessage);
        }
    };

    const onSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage("");
        if (isLoginMode) {
            onSignin();
        } else {
            onSignup();
        }
        setIsLoading(false);
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
            <ErrorModal
                header="Credentials not valid!"
                error={errorMessage}
                onClear={() => setErrorMessage("")}
            />
            <Card className="authentication">
                {isLoading && <LoadingSpinner asOverlay />}
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
