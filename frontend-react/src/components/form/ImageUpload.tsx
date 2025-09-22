import React, { useRef, useState } from "react";

import { fileToUrl } from "../../lib";
import Button from "./Button";

interface ImageUploadValue {
    file: File | null;
    url: string;
}

interface ImageUploadProps {
    onInput: (value: ImageUploadValue) => void;
    value: ImageUploadValue;
    isValid: boolean;
    id: string;
    buttonText?: string;
    disabled?: boolean;
    inverse?: boolean;
    color?: "primary" | "secondary" | "success" | "warning" | "danger";
    errorText?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    onInput,
    value,
    isValid,
    id,
    buttonText,
    disabled,
    inverse,
    color,
    errorText,
}) => {
    const filePickerRef = useRef<HTMLInputElement>(null);

    const [uploadAttempt, setUploadAttempt] = useState<boolean>(false);
    const [uploadValue, setUploadValue] = useState<ImageUploadValue>(value);
    const [uploadError, setUploadError] = useState<string>("");

    const isDisabled = disabled ?? false;
    const isInverse = inverse && !isDisabled ? "inverse" : "";
    const colorChoice = isDisabled ? "disabled" : color || "primary";
    const className = `btn ${colorChoice} ${isInverse}`;
    const showError = (!isValid || !!uploadError) && uploadAttempt;

    const clickHandler = (): void => {
        if (filePickerRef.current) {
            filePickerRef.current.click();
        }
    };

    const changeHandler = async (
        event: React.ChangeEvent<HTMLInputElement>
    ): Promise<void> => {
        setUploadAttempt(true);

        let file: File | null = null;
        let url = "";
        let errorMessage = "";
        const files = event.target.files;
        if (!files || files.length === 0) {
            errorMessage = "Something went wrong! No file found!";
        } else if (files.length > 1) {
            errorMessage = "Please upload only one file at a time!";
        } else {
            try {
                url = await fileToUrl(files[0]);
                file = files[0];
            } catch {
                errorMessage = "Uploaded file corrupted";
            }
        }
        setUploadError(errorMessage);
        setUploadValue({ file, url });
        onInput(uploadValue);
    };

    return (
        <div className="image-upload">
            <input
                id={id}
                ref={filePickerRef}
                className="hidden"
                type="file"
                accept=".jpg,.png,.jpeg"
                onChange={changeHandler}
            />
            <div>
                <div>
                    {uploadValue.url && (
                        <img src={uploadValue.url} alt="Preview" />
                    )}
                    {!uploadValue && (
                        <p className="placeholder">Please pick an image.</p>
                    )}
                </div>
                <Button
                    disabled={isDisabled}
                    className={className}
                    type="button"
                    onClick={clickHandler}
                >
                    {buttonText || "Pick an image"}
                </Button>
            </div>
            <p className={`error-text ${showError ? "" : "invisible"}`}>
                {errorText || uploadError}
            </p>
        </div>
    );
};

export default ImageUpload;
