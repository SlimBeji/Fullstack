import clsx from "clsx";
import type { ElementType, ReactNode } from "react";
import { Link } from "react-router-dom";

import type { ButtonType, ColorType } from "@/types";

import styles from "./Button.module.css";

interface ButtonProps {
    children: ReactNode;
    disabled?: boolean;
    inverse?: boolean;
    color?: ColorType;
    className?: string;
    to?: string;
    href?: string;
    type?: ButtonType;
    onClick?: () => void;
}

const Button: React.FC<ButtonProps> = (props) => {
    const disabled = props.disabled ?? false;
    const customClasses = props.className || "";
    const inverse = props.inverse && !disabled ? "inverse" : "";
    const color = disabled ? "disabled" : props.color || "primary";

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
        <Tag
            className={clsx([styles.btn, color, inverse, customClasses])}
            {...tagProps}
        >
            {props.children}
        </Tag>
    );
};

export default Button;
