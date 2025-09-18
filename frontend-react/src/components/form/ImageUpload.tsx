import React, { useEffect, useReducer, useRef } from "react";

import { fileToUrl } from "../../lib";
import Button from "./Button";

interface ImageUploadState {
    file: File | null;
    url: string;
    isValid: boolean;
    uploadAttempt: boolean;
}

enum ImageUploadActionType {
    CHANGE = "CHANGE",
}

interface ImageUploadChangeAction {
    type: ImageUploadActionType.CHANGE;
    payload: { file: File | null; url: string; isValid: boolean };
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
    const disabled = props.disabled ?? false;
    const inverse = props.inverse && !disabled ? "inverse" : "";
    const color = disabled ? "disabled" : props.color || "primary";
    const className = `btn ${color} ${inverse}`;

    const [state, dispatch] = useReducer(inputReducer, {
        file: props.val?.file || null,
        url: props.val?.url || "",
        isValid: true,
        uploadAttempt: false,
    });
    const filePickerRef = useRef<HTMLInputElement>(null);

    const { required, onInput } = props;
    useEffect(() => {
        let isValid = state.isValid;
        if (required) {
            isValid = state.url ? true : false;
        }
        onInput({ file: state.file, url: state.url }, isValid);
    }, [required, onInput, state.url, state.file, state.isValid]);

    const onClickHandler = (): void => {
        if (filePickerRef.current) {
            filePickerRef.current.click();
        }
    };

    const changeHandler = async (
        event: React.ChangeEvent<HTMLInputElement>
    ): Promise<void> => {
        let file: File | null = null;
        let url = state.url;
        let isValid = state.isValid;
        if (event.target.files?.length === 1) {
            file = event.target.files[0];
            try {
                url = await fileToUrl(file);
                isValid = true;
            } catch {
                isValid = false;
            }
        } else {
            isValid = false;
        }
        dispatch({
            type: ImageUploadActionType.CHANGE,
            payload: { file, url, isValid },
        });
    };

    const isError = !state.isValid && state.uploadAttempt;

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
                    className={className}
                    type="button"
                    onClick={onClickHandler}
                >
                    PICK IMAGE
                </Button>
            </div>
            <p className={`error-text ${isError ? "" : "invisible"}`}>
                {props.errorText}
            </p>
        </div>
    );
};

export default ImageUpload;
