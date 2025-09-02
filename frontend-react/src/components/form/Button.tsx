import { ReactNode } from "react";
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
            disabled={isDisabled}
        >
            {props.children}
        </button>
    );
};

export default Button;
