import type { SyntheticEvent } from "react";

export type ColorType =
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";

export type ButtonType = "button" | "submit" | "reset" | undefined;

export type FormSubmitHandler = (e: SyntheticEvent<HTMLFormElement>) => void;
