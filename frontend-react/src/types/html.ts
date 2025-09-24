import type { FormEvent } from "react";

export type ButtonType = "button" | "submit" | "reset" | undefined;

export type FormSubmitHandler = (e: FormEvent) => void;
