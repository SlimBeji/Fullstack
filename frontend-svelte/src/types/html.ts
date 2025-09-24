export type ButtonType = "button" | "submit" | "reset" | undefined;

export type FormSubmitHandler = (e: SubmitEvent) => void;

export type CssClass = string | Record<string, boolean> | CssClass[];
