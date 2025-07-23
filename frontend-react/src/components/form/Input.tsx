import { ChangeEvent, useReducer, useEffect } from "react";
import "./Input.css";

import { validate, ValidatorType } from "../../util";

interface InputState {
    value: string;
    isValid: boolean;
    isTouched: boolean;
}

enum InputActionType {
    CHANGE = "CHANGE",
    TOUCH = "TOUCH",
}

interface InputChangeAction {
    type: InputActionType.CHANGE;
    payload: { value: string; validators: ValidatorType[] };
}

interface InputTouchAction {
    type: InputActionType.TOUCH;
}

const inputReducer = (
    state: InputState,
    action: InputChangeAction | InputTouchAction
): InputState => {
    switch (action.type) {
        case InputActionType.CHANGE:
            const { value, validators } = action.payload;
            return {
                ...state,
                value: value || "",
                isValid: validate(value, validators),
            };
        case InputActionType.TOUCH:
            return {
                ...state,
                isTouched: true,
            };
        default:
            return state;
    }
};

interface InputProps {
    element?: "input" | "textarea";
    type?: HTMLInputElement["type"];
    id: string;
    label: string;
    onInput: (value: string, isValid: boolean) => void;
    rows?: number;
    placeholder?: string;
    validators?: ValidatorType[];
    errorText?: string;
    value?: string;
    isValid?: boolean;
}

const Input: React.FC<InputProps> = ({
    element,
    type,
    id,
    label,
    onInput,
    rows,
    placeholder,
    validators,
    errorText,
    value,
    isValid,
}) => {
    const [state, dispatch] = useReducer(inputReducer, {
        value: value || "",
        isValid: isValid || false,
        isTouched: false,
    });

    useEffect(() => {
        let isValid = state.isValid;
        if (validators) {
            isValid = validate(state.value, validators);
        }
        onInput(state.value, isValid);
    }, [onInput, state.value, state.isValid]);

    const changeHandler = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        dispatch({
            type: InputActionType.CHANGE,
            payload: {
                value: event.target.value,
                validators: validators || [],
            },
        });
    };

    const touchHandler = () => {
        dispatch({ type: InputActionType.TOUCH });
    };

    let inputElement: React.JSX.Element;
    switch (element) {
        case "textarea":
            inputElement = (
                <textarea
                    value={state.value}
                    id={id}
                    onChange={changeHandler}
                    rows={rows || 3}
                    onBlur={touchHandler}
                />
            );
            break;
        case "input":
        default:
            inputElement = (
                <input
                    value={state.value}
                    id={id}
                    onChange={changeHandler}
                    type={type}
                    placeholder={placeholder}
                    onBlur={touchHandler}
                />
            );
    }

    return (
        <div
            className={`form-control ${
                !state.isValid && state.isTouched && "form-control--invalid"
            }`}
        >
            <label htmlFor={id}>{label}</label>
            {inputElement}
            {!state.isValid && state.isTouched && (
                <p>{errorText || "The input is not valid"}</p>
            )}
        </div>
    );
};

export default Input;
