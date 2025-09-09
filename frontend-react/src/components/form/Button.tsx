import { ElementType, ReactNode } from "react";
import { Link } from "react-router-dom";

import { ButtonType } from "../../types";

interface ButtonProps {
    children: ReactNode;
    disabled?: boolean;
    inverse?: boolean;
    color?: "primary" | "secondary" | "success" | "warning" | "danger";
    className?: string;
    to?: string;
    href?: string;
    type?: ButtonType;
    onClick?: () => void;
}

const Button: React.FC<ButtonProps> = (props) => {
    const customClasses = props.className || "";
    const disabled = props.disabled ?? false;
    const inverse = props.inverse && !disabled ? "inverse" : "";
    const color = disabled ? "disabled" : props.color || "primary";
    const className = `btn ${color} ${inverse} ${customClasses}`;

    let Tag: ElementType = "button";
    const tagProps: any = {};
    if (props.href) {
        Tag = "a";
        tagProps.href = props.href;
    } else if (props.to) {
        Tag = Link;
        tagProps.to = props.to;
    } else {
        tagProps.type = props.type || "button";
        tagProps.onClick = props.onClick;
        if (disabled) tagProps.disabled = true;
    }

    return (
        <Tag className={className} {...tagProps}>
            {props.children}
        </Tag>
    );
};

export default Button;
