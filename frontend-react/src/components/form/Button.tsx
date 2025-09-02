import { ReactNode } from "react";
import { Link } from "react-router-dom";

import { ButtonType } from "../../types";

interface ButtonProps {
    children: ReactNode;
    className?: string;
    to?: string;
    href?: string;
    inverse?: boolean;
    danger?: boolean;
    type?: ButtonType;
    disabled?: boolean;
    onClick?: () => void;
}

const Button: React.FC<ButtonProps> = (props) => {
    let colorClasses;

    if (props.danger) {
        if (props.disabled) {
            colorClasses = "btn-danger-disabled";
        } else {
            colorClasses = "btn-danger";
        }
    } else if (props.inverse) {
        if (props.disabled) {
            colorClasses = "btn-inverse-disabled";
        } else {
            colorClasses = "btn-inverse";
        }
    } else {
        if (props.disabled) {
            colorClasses = "btn-disabled";
        } else {
            colorClasses = "btn";
        }
    }

    const className = `${props.className || ""}`;

    const classes = `${className} btn-default ${colorClasses}`;

    if (props.href) {
        if (props.href) {
            return (
                <a className={classes} href={props.href}>
                    {props.children}
                </a>
            );
        }
    }
    if (props.to) {
        return (
            <Link to={props.to} className={classes}>
                {props.children}
            </Link>
        );
    }

    return (
        <button
            className={classes}
            type={props.type}
            onClick={props.onClick}
            disabled={props.disabled}
        >
            {props.children}
        </button>
    );
};

export default Button;
