import "./PlaceForm.css";

import { emptyStateBuilder, useForm } from "../../shared/hooks/form";

import Input from "../../shared/components/form/Input";
import { Button } from "../../shared/components/form";
import { minLengthValidator } from "../../shared/util/validators";

const Form = {
    title: true,
    address: true,
    description: true,
};

type FormFields = keyof typeof Form;

const initialState = emptyStateBuilder<FormFields>(Form);

const NewPlace: React.FC = () => {
    const [state, inputHandlers] = useForm<FormFields>(initialState);

    const submitHandler = (e: React.FormEvent): void => {
        e.preventDefault();
        console.log("sending data to server", state.inputs);
    };

    return (
        <form className="place-form" onSubmit={submitHandler}>
            <Input
                id="title"
                element="input"
                type="text"
                onInput={inputHandlers.title}
                label="Title"
                validators={[minLengthValidator(8)]}
                errorText="Please enter a valid Title"
            />
            <Input
                id="address"
                element="input"
                type="text"
                onInput={inputHandlers.address}
                label="Address"
                validators={[minLengthValidator(8)]}
                errorText="Please enter a valid address"
            />
            <Input
                id={"description"}
                element="textarea"
                onInput={inputHandlers.description}
                label="Description"
                validators={[minLengthValidator(8)]}
                errorText="Please enter a valid Description"
            />
            <Button type="submit" disabled={!state.isValid}>
                Add Place
            </Button>
        </form>
    );
};

export default NewPlace;
