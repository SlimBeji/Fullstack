import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Button, ImageUpload, Input } from "../components/form";
import PlaceForm from "../components/places/PlaceForm";
import { HttpError, LoadingSpinner } from "../components/ui";
import { emptyStateBuilder, useForm, useHttp } from "../hooks";
import { useAppSelector } from "../states";
import { minLengthValidator } from "../util";
const Form = {
    title: true,
    address: true,
    description: true,
    image: true,
};

type FormFields = keyof typeof Form;

const initialState = emptyStateBuilder<FormFields>(Form);

const NewPlace: React.FC = () => {
    const navigate = useNavigate();
    const authData = useAppSelector((state) => state.auth.data);
    const [data, sendRequest, clearError] = useHttp();
    const [state, inputHandlers] = useForm<FormFields>(initialState);

    const onSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("title", state.inputs.title.val);
        formData.append("image", state.inputs.image.val.file);
        formData.append("description", state.inputs.description.val);
        formData.append("address", state.inputs.address.val);
        formData.append("creatorId", authData?.userId || "");
        try {
            await sendRequest("/places", "post", formData);
            navigate("/");
        } catch (err) {
            console.log(err);
        }
    };

    const titleValidators = useMemo(() => [minLengthValidator(10)], []);
    const addressValidators = useMemo(() => [minLengthValidator(1)], []);
    const descriptionValidators = useMemo(() => [minLengthValidator(10)], []);

    return (
        <>
            {data.error && (
                <HttpError error={data.error} onClear={clearError} />
            )}
            <PlaceForm onSubmit={onSubmit}>
                {data.loading && <LoadingSpinner asOverlay />}
                <Input
                    id="title"
                    element="input"
                    type="text"
                    onInput={inputHandlers.title}
                    label="Title"
                    validators={titleValidators}
                    errorText="Please enter a valid Title"
                />
                <Input
                    id="address"
                    element="input"
                    type="text"
                    onInput={inputHandlers.address}
                    label="Address"
                    validators={addressValidators}
                    errorText="Please enter a valid address"
                />
                <Input
                    id={"description"}
                    element="textarea"
                    onInput={inputHandlers.description}
                    label="Description"
                    validators={descriptionValidators}
                    errorText="Please enter a valid Description"
                />
                <ImageUpload
                    id="image"
                    onInput={inputHandlers.image}
                    val={state.inputs.image.val}
                />
                <Button type="submit" disabled={!state.isValid}>
                    Add Place
                </Button>
            </PlaceForm>
        </>
    );
};

export default NewPlace;
