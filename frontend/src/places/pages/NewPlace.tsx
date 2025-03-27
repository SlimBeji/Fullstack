import "./PlaceForm.css";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

import Input from "../../shared/components/form/Input";
import { Button } from "../../shared/components/form";
import { minLengthValidator } from "../../shared/util/validators";
import { useHttp, emptyStateBuilder, useForm } from "../../shared/hooks";
import { AuthContext } from "../../shared/context";
import { ErrorModal, LoadingSpinner } from "../../shared/components/ui";

const Form = {
    title: true,
    address: true,
    description: true,
};

type FormFields = keyof typeof Form;

const initialState = emptyStateBuilder<FormFields>(Form);

const NewPlace: React.FC = () => {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const [state, inputHandlers] = useForm<FormFields>(initialState);
    const [data, sendRequest, clearError] = useHttp();

    const submitHandler = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        try {
            await sendRequest("/places", "post", {
                title: state.inputs.title.val,
                description: state.inputs.description.val,
                address: state.inputs.address.val,
                creatorId: auth.userId,
            });
            navigate("/");
        } catch (err) {}
    };

    return (
        <>
            {data.error && (
                <ErrorModal error={data.error.message} onClear={clearError} />
            )}
            <form className="place-form" onSubmit={submitHandler}>
                {data.loading && <LoadingSpinner asOverlay />}
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
        </>
    );
};

export default NewPlace;
