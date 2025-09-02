import { ChangeEvent, useEffect, useReducer } from "react";

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

    let inputElement: React.JSX.Element;
    switch (element) {
        case "textarea":
            inputElement = (
                <textarea
                    value={state.value}
                    className="w-full rounded-md border px-3 py-2 text-gray-800 border-gray-300 bg-gray-50 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500 error:bg-red-50 error:border-red-500"
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
                    className="w-full rounded-md border px-3 py-2 text-gray-800 border-gray-300 bg-gray-50 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500 error:bg-red-50 error:border-red-500"
                    id={id}
                    onChange={changeHandler}
                    type={type}
                    placeholder={placeholder}
                    onBlur={touchHandler}
                />
            );
    }

    return (
        <div className={`mb-4 ${isError ? "error" : ""}`}>
            <label
                className="block font-semibold mb-2 text-gray-700 error:text-red-500"
                htmlFor={id}
            >
                {label}
            </label>
            {inputElement}
            {isError && (
                <p className="mt-1 text-sm text-red-500">
                    {errorText || "The input is not valid"}
                </p>
            )}
        </div>
    );
};

export default Input;
