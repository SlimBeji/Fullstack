import type { ChangeEvent, ElementType } from "react";
import { useState } from "react";

interface InputProps {
    onInput: (value: string) => void;
    value?: string;
    isValid?: boolean;
    id: string;
    label: string;
    className?: string;
    element?: "input" | "textarea";
    type?: HTMLInputElement["type"];
    disabled?: boolean;
    rows?: number;
    placeholder?: string;
    errorText?: string;
}

const Input: React.FC<InputProps> = ({
    onInput,
    value,
    isValid,
    id,
    label,
    className,
    element,
    type,
    disabled,
    rows,
    placeholder,
    errorText,
}) => {
    const [isTouched, setIsTouched] = useState<boolean>(false);

    const changeHandler = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        onInput(event.target.value);
    };

    const touchHandler = () => {
        if (!disabled) setIsTouched(true);
    };

    const isError = !isValid && isTouched;

    let Tag: ElementType = "input";
    const tagProps: Record<string, any> = {
        value: value || "",
        id,
        onChange: changeHandler,
        onBlur: touchHandler,
        className: disabled ? "disabled" : "active",
        disabled: disabled ?? false,
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
        <div
            className={`input-container ${className || "basis-full"} ${isError ? "error" : ""}`}
        >
            <label htmlFor={id}>{label}</label>
            <Tag {...tagProps} />
            <p className={`error-text ${isError ? "" : "invisible"}`}>
                {errorText || "The input is not valid"}
            </p>
        </div>
    );
};

export default Input;
