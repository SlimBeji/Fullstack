import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
    emptyStateBuilder,
    minLengthValidator,
    numericValidator,
    useForm,
    useHttp,
} from "../../lib";
import { useAppSelector } from "../../store";
import { Button, ImageUpload, Input } from "../form";
import { HttpError, LoadingSpinner } from "../ui";
const Form = {
    title: true,
    address: true,
    description: true,
    lat: true,
    lng: true,
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
        formData.append(
            "location",
            JSON.stringify({
                lat: state.inputs.lat.val,
                lng: state.inputs.lng.val,
            })
        );
        formData.append("creatorId", authData?.userId || "");
        try {
            await sendRequest("/places/", "post", formData);
            navigate("/");
        } catch (err) {
            console.log(err);
        }
    };

    const titleValidators = useMemo(() => [minLengthValidator(10)], []);
    const addressValidators = useMemo(() => [minLengthValidator(1)], []);
    const descriptionValidators = useMemo(() => [minLengthValidator(10)], []);
    const coordinateValidators = useMemo(() => [numericValidator()], []);

    return (
        <>
            {data.error && (
                <HttpError error={data.error} onClear={clearError} />
            )}
            <form className="place-create" onSubmit={onSubmit}>
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
                <Input
                    id={"latitude"}
                    element="input"
                    onInput={inputHandlers.lat}
                    label="Latitude"
                    validators={coordinateValidators}
                    errorText="Please enter a valid Latitude"
                />
                <Input
                    id={"longitude"}
                    element="input"
                    onInput={inputHandlers.lng}
                    label="Longitude"
                    validators={coordinateValidators}
                    errorText="Please enter a valid Longitude"
                />
                <ImageUpload
                    id="image"
                    color="secondary"
                    onInput={inputHandlers.image}
                />
                <div className="buttons">
                    <Button
                        type="submit"
                        color="secondary"
                        disabled={!state.isValid}
                    >
                        Add Place
                    </Button>
                </div>
            </form>
        </>
    );
};

export default NewPlace;
