import { Link } from "react-router-dom";

import "./Button.css";
import { ReactNode } from "react";
import { ButtonType } from "../../types";

interface ButtonProps {
    children: ReactNode;
    to?: string;
    href?: string;
    size?: string;
    inverse?: boolean;
    danger?: boolean;
    type?: ButtonType;
    disabled?: boolean;
    onClick?: () => void;
}

const Button: React.FC<ButtonProps> = (props) => {
    if (props.href) {
        return (
            <a
                className={`button button--${props.size || "default"} ${
                    props.inverse && "button--inverse"
                } ${props.danger && "button--danger"}`}
                href={props.href}
            >
                {props.children}
            </a>
        );
    }
    if (props.to) {
        return (
            <Link
                to={props.to}
                className={`button button--${props.size || "default"} ${
                    props.inverse && "button--inverse"
                } ${props.danger && "button--danger"}`}
            >
                {props.children}
            </Link>
        );
    }
    return (
        <button
            className={`button button--${props.size || "default"} ${
                props.inverse && "button--inverse"
            } ${props.danger && "button--danger"}`}
            type={props.type}
            onClick={props.onClick}
            disabled={props.disabled}
        >
            {props.children}
        </button>
    );
};

export default Button;
