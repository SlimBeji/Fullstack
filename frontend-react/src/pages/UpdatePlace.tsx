import { AxiosResponse } from "axios";
import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";

import { Button, Input } from "../components/form";
import { PlaceForm } from "../components/places";
import { HttpError, LoadingSpinner } from "../components/ui";
import { emptyStateBuilder, useForm, useHttp } from "../hooks";
import { minLengthValidator } from "../util";

const Form = {
    title: true,
    address: true,
    description: true,
};

type FormFields = keyof typeof Form;

const initialState = emptyStateBuilder<FormFields>(Form);

const UpdatePlace: React.FC = () => {
    const [state, inputHandlers, setFormData] =
        useForm<FormFields>(initialState);
    const [data, sendRequest, clearError] = useHttp();

    const placeId = useParams().placeId!;
    useEffect(() => {
        sendRequest(`/places/${placeId}`, "get").then((resp: AxiosResponse) => {
            const { data } = resp;
            setFormData([
                { fieldName: "title", val: data.title, isValid: true },
                { fieldName: "address", val: data.address, isValid: true },
                {
                    fieldName: "description",
                    val: data.description,
                    isValid: true,
                },
            ]);
        });
    }, [sendRequest, setFormData, placeId]);

    const submitHandler = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        try {
            await sendRequest(`/places/${placeId}`, "put", {
                title: state.inputs.title?.val,
                address: state.inputs.address?.val,
                description: state.inputs.description?.val,
            });
        } catch (err) {
            console.log(err);
        }
    };

    const titleValidators = useMemo(() => [minLengthValidator(10)], []);
    const addressValidators = useMemo(() => [minLengthValidator(1)], []);
    const descriptionValidators = useMemo(() => [minLengthValidator(10)], []);

    const renderForm = (): React.JSX.Element | undefined => {
        if (data.loading || !data.json) {
            return;
        }

        return (
            <PlaceForm onSubmit={submitHandler}>
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
                <Button
                    type="submit"
                    className={`${state.isValid ? "" : "disabled"}`}
                >
                    Edit Place
                </Button>
            </PlaceForm>
        );
    };

    return (
        <>
            {data.error && (
                <HttpError error={data.error} onClear={clearError} />
            )}
            {data.loading && (
                <div className="center">
                    <LoadingSpinner asOverlay />
                </div>
            )}
            {renderForm()}
        </>
    );
};

export default UpdatePlace;
