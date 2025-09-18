import React, { useEffect, useReducer, useRef } from "react";

import { fileToUrl } from "../../lib";
import Button from "./Button";

interface ImageUploadState {
    file: File | null;
    url: string;
    errorMessage: string;
    uploadAttempt: boolean;
}

enum ImageUploadActionType {
    CHANGE = "CHANGE",
}

interface ImageUploadChangeAction {
    type: ImageUploadActionType.CHANGE;
    payload: { file: File | null; url: string; errorMessage: string };
}

const inputReducer = (
    state: ImageUploadState,
    action: ImageUploadChangeAction
): ImageUploadState => {
    switch (action.type) {
        case ImageUploadActionType.CHANGE:
            return {
                ...state,
                ...action.payload,
                uploadAttempt: true,
            };
        default:
            return state;
    }
};

interface ImageUploadValue {
    file: File | null;
    url: string;
}

interface ImageUploadProps {
    id: string;
    disabled?: boolean;
    inverse?: boolean;
    color?: "primary" | "secondary" | "success" | "warning" | "danger";
    onInput: (val: ImageUploadValue, isValid: boolean) => void;
    errorText?: string;
    val?: ImageUploadValue;
    required?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = (props) => {
    const filePickerRef = useRef<HTMLInputElement>(null);
    const [state, dispatch] = useReducer(inputReducer, {
        file: props.val?.file || null,
        url: props.val?.url || "",
        errorMessage: "",
        uploadAttempt: false,
    });

    const disabled = props.disabled ?? false;
    const inverse = props.inverse && !disabled ? "inverse" : "";
    const color = disabled ? "disabled" : props.color || "primary";
    const className = `btn ${color} ${inverse}`;
    const isError = !!state.errorMessage && state.uploadAttempt;

    const { required, onInput } = props;
    useEffect(() => {
        let isValid = true;
        if (required) {
            isValid = state.url ? true : false;
        }
        onInput({ file: state.file, url: state.url }, isValid);
    }, [required, onInput, state.url, state.file]);

    const onClickHandler = (): void => {
        if (filePickerRef.current) {
            filePickerRef.current.click();
        }
    };

    const changeHandler = async (
        event: React.ChangeEvent<HTMLInputElement>
    ): Promise<void> => {
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
        dispatch({
            type: ImageUploadActionType.CHANGE,
            payload: { file, url, errorMessage },
        });
    };

    return (
        <div className="image-upload">
            <input
                id={props.id}
                ref={filePickerRef}
                className="hidden"
                type="file"
                accept=".jpg,.png,.jpeg"
                onChange={changeHandler}
            />
            <div>
                <div>
                    {state.url && <img src={state.url} alt="Preview" />}
                    {!state.url && (
                        <p className="placeholder">Please pick an image.</p>
                    )}
                </div>
                <Button
                    disabled
                    className={className}
                    type="button"
                    onClick={onClickHandler}
                >
                    PICK IMAGE
                </Button>
            </div>
            <p className={`error-text ${isError ? "" : "invisible"}`}>
                {props.errorText || state.errorMessage}
            </p>
        </div>
    );
};

export default ImageUpload;
