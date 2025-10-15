import { useNavigate } from "react-router-dom";

import type { FormConfig } from "@/lib";
import { minLengthValidator, numericValidator, useForm, useHttp } from "@/lib";
import { useAppSelector } from "@/store";

import { Button, ImageUpload, Input } from "../form";
import { HttpError, LoadingSpinner } from "../ui";

const CreatePlaceFormConfig: FormConfig = {
    title: { validators: [minLengthValidator(10)] },
    address: { validators: [minLengthValidator(1)] },
    description: { validators: [minLengthValidator(10)] },
    lat: { validators: [numericValidator()] },
    lng: { validators: [numericValidator()] },
    image: { initial: { file: null, url: "" } },
};

type FieldsType = keyof typeof CreatePlaceFormConfig;

const NewPlace: React.FC = () => {
    const navigate = useNavigate();
    const authData = useAppSelector((state) => state.auth.data);
    const [data, sendRequest, clearError] = useHttp();
    const [state, inputHandlers] = useForm<FieldsType>(CreatePlaceFormConfig);

    const onSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("title", state.fields.title.value);
        formData.append("image", state.fields.image.value.file);
        formData.append("description", state.fields.description.value);
        formData.append("address", state.fields.address.value);
        formData.append("lat", state.fields.lat.value);
        formData.append("lng", state.fields.lng.value);
        formData.append("creatorId", authData?.userId || "");
        try {
            await sendRequest("/places/", "post", formData);
            navigate("/");
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <>
            {data.error?.message && (
                <HttpError error={data.error} onClear={clearError} />
            )}
            <form className="place-create" onSubmit={onSubmit}>
                {data.loading && <LoadingSpinner asOverlay />}
                <Input
                    onInput={inputHandlers.title}
                    value={state.fields.title.value}
                    isValid={state.fields.title.valid}
                    id="title"
                    element="input"
                    type="text"
                    label="Title"
                    errorText="Please enter a valid Title"
                />
                <Input
                    onInput={inputHandlers.address}
                    value={state.fields.address.value}
                    isValid={state.fields.address.valid}
                    id="address"
                    element="input"
                    type="text"
                    label="Address"
                    errorText="Please enter a valid address"
                />
                <Input
                    onInput={inputHandlers.description}
                    value={state.fields.description.value}
                    isValid={state.fields.description.valid}
                    id="description"
                    element="textarea"
                    label="Description"
                    errorText="Please enter a valid Description"
                />
                <Input
                    onInput={inputHandlers.lat}
                    value={state.fields.lat.value}
                    isValid={state.fields.lat.valid}
                    id="latitude"
                    className="basis-full sm:basis-1/2 sm:pr-2"
                    element="input"
                    type="number"
                    step="any"
                    label="Latitude"
                    errorText="Please enter a valid Latitude"
                />
                <Input
                    onInput={inputHandlers.lng}
                    value={state.fields.lng.value}
                    isValid={state.fields.lng.valid}
                    id="longitude"
                    className="basis-full sm:basis-1/2 sm:pl-2"
                    element="input"
                    type="number"
                    step="any"
                    label="Longitude"
                    errorText="Please enter a valid Longitude"
                />
                <ImageUpload
                    onInput={inputHandlers.image}
                    value={state.fields.image.value}
                    isValid={state.fields.image.valid}
                    id="image"
                    color="secondary"
                />
                <div className="buttons">
                    <Button
                        type="submit"
                        color="secondary"
                        disabled={!state.valid}
                    >
                        Add Place
                    </Button>
                </div>
            </form>
        </>
    );
};

export default NewPlace;
