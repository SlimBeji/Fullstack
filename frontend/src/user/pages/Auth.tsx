import "./Auth.css";

import { useState, useContext } from "react";

import { AuthContext } from "../../shared/context";
import { useForm, emptyStateBuilder } from "../../shared/hooks/form";
import { Card } from "../../shared/components/ui";
import { Input } from "../../shared/components/form";
import { Button } from "../../shared/components/form";

import {
    emailValidator,
    minLengthValidator,
    anyValidator,
    ValidatorType,
} from "../../shared/util/validators";

enum AuthForm {
    USERNAME = "username",
    EMAIL = "email",
    PASSWORD = "password",
}

type AuthFormTypes = `${AuthForm}`;

const emptyState = emptyStateBuilder<AuthFormTypes>(AuthForm);

/* Initially username is hidden because we are in login
mode so start from isValid=true, since it is not taken
into account in the loginform */
emptyState.inputs.username.isValid = true;

const Auth: React.FC = () => {
    const auth = useContext(AuthContext);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [state, inputHandler, setData] = useForm<AuthFormTypes>(emptyState);

    let verb: "Authenticate" | "Register";
    let requiredText: "Login Required" | "Registration Required";
    let switchText: "Swith to login" | "Switch to signup";
    let usernameValidators: ValidatorType[];
    if (isLoginMode) {
        verb = "Authenticate";
        requiredText = "Login Required";
        switchText = "Switch to signup";
        usernameValidators = [anyValidator()];
    } else {
        verb = "Register";
        requiredText = "Registration Required";
        switchText = "Swith to login";
        usernameValidators = [minLengthValidator(8)];
    }

    const onSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (isLoginMode) {
            console.log(
                verb,
                state.inputs.email.val,
                state.inputs.password.val
            );
        } else {
            console.log(
                verb,
                state.inputs.username.val,
                state.inputs.email.val,
                state.inputs.password.val
            );
        }
        auth.login();
    };

    const onSwitchModeHandler = () => {
        setIsLoginMode((prev: boolean) => {
            if (!prev) {
                // Previous mode is Signup
                // Next mode is login
                // Set username validity to true
                setData({
                    inputs: {
                        username: {
                            isValid: true,
                            val: state.inputs.username.val,
                        },
                    },
                });
            }
            return !prev;
        });
    };

    return (
        <Card className="authentication">
            <h2>{requiredText}</h2>
            <hr />
            <form onSubmit={onSubmit}>
                {!isLoginMode && (
                    <Input
                        onInput={inputHandler}
                        element="input"
                        id="username"
                        type="text"
                        label="Username"
                        validators={usernameValidators}
                        errorText="Please enter a valid username of at least 8 characters"
                        value={state.inputs.username.val || ""}
                    />
                )}
                <Input
                    onInput={inputHandler}
                    element="input"
                    id="email"
                    type="email"
                    label="E-Mail"
                    validators={[emailValidator()]}
                    errorText="Please enter a valid email"
                />
                <Input
                    onInput={inputHandler}
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
    );
};

export default Auth;
