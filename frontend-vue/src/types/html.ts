export type ButtonType = "button" | "submit" | "reset" | undefined;

export type FormSubmitHandler = (e: SubmitEvent) => void;

export interface ImageUploadValue {
    file: File | null;
    url: string;
}
