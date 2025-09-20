import { AxiosResponse } from "axios";
import { useEffect, useMemo } from "react";

import {
    emptyStateBuilder,
    minLengthValidator,
    numericValidator,
    useForm,
    useHttp,
} from "../../lib";
import { Place } from "../../types";
import { Button, Input } from "../form";
import { HttpError, LoadingSpinner } from "../ui";

const Form = {
    title: true,
    address: true,
    description: true,
    lat: true,
    lng: true,
};

type FormFields = keyof typeof Form;

const initialState = emptyStateBuilder<FormFields>(Form);

interface PlaceUpdateFormProps {
    placeId: string;
}

const PlaceUpdateForm: React.FC<PlaceUpdateFormProps> = ({ placeId }) => {
    const [state, inputHandlers, setFormData] =
        useForm<FormFields>(initialState);
    const [data, sendRequest, clearError] = useHttp();

    useEffect(() => {
        sendRequest(`/places/${placeId}`, "get").then(
            (resp: AxiosResponse<Place>) => {
                const { data } = resp;
                setFormData({
                    title: { val: data.title, isValid: true },
                    address: { val: data.address, isValid: true },
                    description: { val: data.description, isValid: true },
                    lat: { val: String(data.location.lat), isValid: true },
                    lng: { val: String(data.location.lng), isValid: true },
                });
            }
        );
    }, [sendRequest, setFormData, placeId]);

    const submitHandler = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        try {
            await sendRequest(`/places/${placeId}`, "put", {
                title: state.inputs.title.val,
                address: state.inputs.address.val,
                description: state.inputs.description.val,
                location: {
                    lat: state.inputs.lat.val,
                    lng: state.inputs.lng.val,
                },
            });
        } catch (err) {
            console.log(err);
        }
    };

    const titleValidators = useMemo(() => [minLengthValidator(10)], []);
    const addressValidators = useMemo(() => [minLengthValidator(1)], []);
    const descriptionValidators = useMemo(() => [minLengthValidator(10)], []);
    const coordinateValidators = useMemo(() => [numericValidator()], []);

    if (data.error?.message) {
        return <HttpError error={data.error} onClear={clearError} />;
    }

    if (data.loading) {
        return <LoadingSpinner asOverlay />;
    }

    return (
        <form className="place-update" onSubmit={submitHandler}>
            <Input
                id="title"
                element="input"
                type="text"
                onInput={inputHandlers.title}
                label="Title"
                validators={titleValidators}
                errorText="Please enter a valid Title"
                value={state.inputs.title.val}
                isValid={state.inputs.title.isValid}
            />
            <Input
                id="address"
                element="input"
                type="text"
                onInput={inputHandlers.address}
                label="Address"
                validators={addressValidators}
                errorText="Please enter a valid Address"
                value={state.inputs.address.val}
                isValid={state.inputs.address.isValid}
            />
            <Input
                id="description"
                element="textarea"
                onInput={inputHandlers.description}
                label="Description"
                validators={descriptionValidators}
                errorText="Please enter a valid Description"
                value={state.inputs.description.val}
                isValid={state.inputs.description.isValid}
            />
            <Input
                id="latitude"
                width="1/2"
                padding="pr-2"
                element="input"
                onInput={inputHandlers.lat}
                label="Latitude"
                validators={coordinateValidators}
                errorText="Please enter a valid Latitude"
                value={state.inputs.lat.val}
                isValid={state.inputs.lat.isValid}
            />
            <Input
                id="longitude"
                width="1/2"
                padding="pl-2"
                element="input"
                onInput={inputHandlers.lng}
                label="Longitude"
                validators={coordinateValidators}
                errorText="Please enter a valid Longitude"
                value={state.inputs.lng.val}
                isValid={state.inputs.lng.isValid}
            />
            <div className="buttons">
                <Button
                    type="submit"
                    color="secondary"
                    disabled={!state.isValid}
                >
                    Edit Place
                </Button>
            </div>
        </form>
    );
};

export default PlaceUpdateForm;
