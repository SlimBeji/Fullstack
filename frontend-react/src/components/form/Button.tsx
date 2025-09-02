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
    const baseClasses =
        "px-6 py-2 text-base rounded-md font-medium transition-colors duration-200 focus:outline-none inline-block";

    let colorClasses;

    if (props.danger) {
        if (props.disabled) {
            colorClasses =
                "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed";
        } else {
            colorClasses =
                "bg-red-800 hover:bg-red-600 text-white border-red-800";
        }
    } else if (props.inverse) {
        if (props.disabled) {
            colorClasses =
                "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed";
        } else {
            colorClasses =
                "bg-transparent hover:bg-pink-500 text-pink-600 hover:text-white border border-pink-600";
        }
    } else {
        if (props.disabled) {
            colorClasses =
                "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed";
        } else {
            colorClasses =
                "bg-pink-600 hover:bg-pink-500 text-white border border-pink-600";
        }
    }

    const classes = `${props.className || ""} ${baseClasses} ${colorClasses}`;

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
