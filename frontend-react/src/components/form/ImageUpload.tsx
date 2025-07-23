import React, { useRef, useReducer, useEffect } from "react";

import "./ImageUpload.css";

import Button from "./Button";

const fileToUrl = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
};

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
    center?: boolean;
    onInput: (val: ImageUploadValue, isValid: boolean) => void;
    errorText?: string;
    val?: ImageUploadValue;
    required?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    id,
    center = true,
    onInput,
    errorText = "Could not read the file",
    val = undefined,
    required = false,
}) => {
    const [state, dispatch] = useReducer(inputReducer, {
        file: val?.file || null,
        url: val?.url || "",
        isValid: true,
        uploadAttempt: false,
    });
    const filePickerRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let isValid = state.isValid;
        if (required) {
            isValid = state.url ? true : false;
        }
        onInput({ file: state.file, url: state.url }, isValid);
    }, [onInput, required, state.url, state.isValid]);

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

    return (
        <div className="form-control">
            <input
                id={id}
                ref={filePickerRef}
                style={{ display: "none" }}
                type="file"
                accept=".jpg,.png,.jpeg"
                onChange={changeHandler}
            />
            <div className={`image-upload ${center && "center"}`}>
                <div className="image-upload__preview">
                    {state.url && <img src={state.url} alt="Preview" />}
                    {!state.url && <p>Please pick an image.</p>}
                </div>
                <Button type="button" onClick={onClickHandler}>
                    PICK IMAGE
                </Button>
            </div>
            {!state.isValid && state.uploadAttempt && <p>{errorText}</p>}
        </div>
    );
};

export default ImageUpload;
