import "./PlaceForm.css";

import { emptyStateBuilder, useForm } from "../../shared/hooks/form";

import Input from "../../shared/components/form/Input";
import { Button } from "../../shared/components/form";
import { minLengthValidator } from "../../shared/util/validators";

enum FieldNames {
    TITLE = "title",
    ADDRESS = "address",
    DESCRIPTION = "description",
}

type FieldNamesType = `${FieldNames}`;

const initialState = emptyStateBuilder<FieldNamesType>(FieldNames);

const NewPlace: React.FC = () => {
    const [state, inputHandler] = useForm<FieldNamesType>(initialState);

    const submitHandler = (e: React.FormEvent): void => {
        e.preventDefault();
        console.log(
            "sending data to server",
            state.inputs.title?.val,
            state.inputs.address?.val,
            state.inputs.description?.val
        );
    };

    return (
        <form className="place-form" onSubmit={submitHandler}>
            <Input
                id={FieldNames.TITLE}
                element="input"
                type="text"
                onInput={inputHandler}
                label="Title"
                validators={[minLengthValidator(8)]}
                errorText="Please enter a valid Title"
            />
            <Input
                id={FieldNames.ADDRESS}
                element="input"
                type="text"
                onInput={inputHandler}
                label="Address"
                validators={[minLengthValidator(8)]}
                errorText="Please enter a valid address"
            />
            <Input
                id={FieldNames.DESCRIPTION}
                element="textarea"
                onInput={inputHandler}
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
