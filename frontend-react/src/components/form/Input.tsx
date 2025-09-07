import { ChangeEvent, ElementType, useEffect, useReducer } from "react";

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
            return {
                ...state,
                value: action.payload.value || "",
                isValid: validate(
                    action.payload.value,
                    action.payload.validators
                ),
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
    }, [onInput, state.value, state.isValid, validators]);

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

    const isError = !state.isValid && state.isTouched;

    let Tag: ElementType = "input";
    const tagProps: Record<string, any> = {
        value: state.value,
        id,
        onChange: changeHandler,
        onBlur: touchHandler,
    };

    switch (element) {
        case "textarea":
            Tag = "textarea";
            tagProps.rows = rows || 3;
            break;
        case "input":
        default:
            tagProps.type = type;
            tagProps.placeholder = placeholder;
            break;
    }

    return (
        <div className={`input-container ${isError ? "error" : ""}`}>
            <label htmlFor={id}>{label}</label>
            <Tag {...tagProps} />
            <p className={`error-text ${isError ? "" : "invisible"}`}>
                {errorText || "The input is not valid"}
            </p>
        </div>
    );
};

export default Input;
