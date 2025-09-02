import "./Button.css";

import { ElementType, ReactNode } from "react";
import { Link } from "react-router-dom";

import { ButtonType } from "../../types";

interface ButtonProps {
    children: ReactNode;
    className?: string;
    to?: string;
    href?: string;
    type?: ButtonType;
    onClick?: () => void;
}

const Button: React.FC<ButtonProps> = (props) => {
    const classes = ` btn ${props.className || ""}`;
    const isDisabled = classes.includes("disabled");

    let Tag: string | ElementType = "";
    const tagProps: any = {};
    if (props.href) {
        Tag = "a";
        tagProps.href = props.href;
    } else if (props.to) {
        Tag = Link;
        tagProps.to = props.to;
    } else {
        Tag = "button";
        tagProps.type = props.type || "button";
        tagProps.onClick = props.onClick;
        if (isDisabled) tagProps.disabled = true;
    }

    return (
        <Tag className={classes} {...tagProps}>
            {props.children}
        </Tag>
    );
};

export default Button;
