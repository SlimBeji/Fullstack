import { AxiosResponse } from "axios";
import { useEffect } from "react";

import {
    FormConfig,
    minLengthValidator,
    numericValidator,
    useForm,
    useHttp,
} from "../../lib";
import { Place } from "../../types";
import { Button, Input } from "../form";
import { HttpError, LoadingSpinner } from "../ui";

const UpdatePlaceFormConfig: FormConfig = {
    title: { validators: [minLengthValidator(10)] },
    address: { validators: [minLengthValidator(1)] },
    description: { validators: [minLengthValidator(10)] },
    lat: { validators: [numericValidator()] },
    lng: { validators: [numericValidator()] },
};

type FieldsType = keyof typeof UpdatePlaceFormConfig;

interface PlaceUpdateFormProps {
    placeId: string;
}

const PlaceUpdateForm: React.FC<PlaceUpdateFormProps> = ({ placeId }) => {
    const [state, inputHandlers, prefillData] = useForm<FieldsType>(
        UpdatePlaceFormConfig
    );
    const [data, sendRequest, clearError] = useHttp();

    useEffect(() => {
        sendRequest(`/places/${placeId}`, "get").then(
            (resp: AxiosResponse<Place>) => {
                const { data } = resp;
                prefillData({
                    title: data.title,
                    address: data.address,
                    description: data.description,
                    lat: String(data.location.lat),
                    lng: String(data.location.lng),
                });
            }
        );
    }, [sendRequest, prefillData, placeId]);

    const submitHandler = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        try {
            await sendRequest(`/places/${placeId}`, "put", {
                title: state.fields.title.value,
                address: state.fields.address.value,
                description: state.fields.description.value,
                location: {
                    lat: state.fields.lat.value,
                    lng: state.fields.lng.value,
                },
            });
        } catch (err) {
            console.log(err);
        }
    };

    if (data.error?.message) {
        return <HttpError error={data.error} onClear={clearError} />;
    }

    if (data.loading) {
        return <LoadingSpinner asOverlay />;
    }

    return (
        <form className="place-update" onSubmit={submitHandler}>
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
                errorText="Please enter a valid Address"
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
                element="input"
                label="Latitude"
                errorText="Please enter a valid Latitude"
            />
            <Input
                onInput={inputHandlers.lng}
                value={state.fields.lng.value}
                isValid={state.fields.lng.valid}
                id="longitude"
                element="input"
                label="Longitude"
                errorText="Please enter a valid Longitude"
            />
            <div className="buttons">
                <Button type="submit" color="secondary" disabled={!state.valid}>
                    Edit Place
                </Button>
            </div>
        </form>
    );
};

export default PlaceUpdateForm;
