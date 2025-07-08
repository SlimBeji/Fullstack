import "./PlaceForm.css";

import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { useForm, emptyStateBuilder, useHttp } from "../hooks";
import { Button, Input } from "../components/form";
import { HttpError, LoadingSpinner } from "../components/ui";
import { minLengthValidator } from "../util";
import { AxiosResponse } from "axios";

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

    const renderForm = (): React.JSX.Element | undefined => {
        if (data.loading || !data.json) {
            return;
        }

        return (
            <form className="place-form" onSubmit={submitHandler}>
                <Input
                    id="title"
                    element="input"
                    type="text"
                    onInput={inputHandlers.title}
                    label="Title"
                    validators={[minLengthValidator(10)]}
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
                    validators={[minLengthValidator(1)]}
                    errorText="Please enter a valid Address"
                    value={state.inputs.address.val}
                    isValid={state.inputs.address.isValid}
                />
                <Input
                    id="description"
                    element="textarea"
                    onInput={inputHandlers.description}
                    label="Description"
                    validators={[minLengthValidator(10)]}
                    errorText="Please enter a valid Description"
                    value={state.inputs.description.val}
                    isValid={state.inputs.description.isValid}
                />
                <Button type="submit" disabled={!state.isValid}>
                    Edit Place
                </Button>
            </form>
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
