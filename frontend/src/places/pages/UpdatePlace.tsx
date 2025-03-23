import "./PlaceForm.css";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useForm, emptyStateBuilder } from "../../shared/hooks/form";
import { Button, Input } from "../../shared/components/form";
import { Card } from "../../shared/components/ui";
import {
    requireValidator,
    minLengthValidator,
} from "../../shared/util/validators";

import { DUMMY_PLACES } from "./data";

const Form = {
    title: true,
    description: true,
};

type FormFields = keyof typeof Form;

const initialState = emptyStateBuilder<FormFields>(Form);

const UpdatePlace: React.FC = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    const [state, inputHandlers, setFormData] =
        useForm<FormFields>(initialState);

    const placeId = Number(useParams().placeId!);

    const place = DUMMY_PLACES.find((place) => {
        return place.id === placeId;
    });

    useEffect(() => {
        if (!place) {
            return;
        }
        setFormData([
            { fieldName: "title", val: place.title, isValid: true },
            { fieldName: "description", val: place.description, isValid: true },
        ]);
        setIsLoaded(true);
    }, [place, setFormData, setIsLoaded]);

    if (!place) {
        return (
            <div className="center">
                <Card>
                    <h2>Could not find place!</h2>
                </Card>
            </div>
        );
    }

    const submitHandler = (e: React.FormEvent): void => {
        e.preventDefault();
        console.log(
            "sending data to server",
            state.inputs.title?.val,
            state.inputs.description?.val
        );
    };

    const formContent = (
        <form className="place-form" onSubmit={submitHandler}>
            <Input
                id="title"
                element="input"
                type="text"
                onInput={inputHandlers.title}
                label="Title"
                validators={[requireValidator()]}
                errorText="Please enter a valid Title"
                value={state.inputs.title.val}
                isValid={state.inputs.title.isValid}
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

    if (isLoaded) {
        return formContent;
    } else {
        return <div>LOADING...</div>;
    }
};

export default UpdatePlace;
