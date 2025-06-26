import "./PlaceForm.css";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

import { minLengthValidator } from "../../util";
import { useHttp, emptyStateBuilder, useForm } from "../../hooks";
import { AuthContext } from "../../stores";
import { ErrorModal, LoadingSpinner } from "../../components/ui";
import { Button, Input, ImageUpload } from "../../components/form";

const Form = {
    title: true,
    address: true,
    description: true,
    image: true,
};

type FormFields = keyof typeof Form;

const initialState = emptyStateBuilder<FormFields>(Form);

const NewPlace: React.FC = () => {
    const navigate = useNavigate();
    const auth = useContext(AuthContext);
    const [data, sendRequest, clearError] = useHttp();
    const [state, inputHandlers] = useForm<FormFields>(initialState);

    const onSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("title", state.inputs.title.val);
        formData.append("image", state.inputs.image.val.file);
        formData.append("description", state.inputs.description.val);
        formData.append("address", state.inputs.address.val);
        formData.append("creatorId", auth.authData?.userId || "");
        try {
            await sendRequest("/places", "post", formData);
            navigate("/");
        } catch (err) {}
    };

    return (
        <>
            {data.error && (
                <ErrorModal error={data.error.message} onClear={clearError} />
            )}
            <form className="place-form" onSubmit={onSubmit}>
                {data.loading && <LoadingSpinner asOverlay />}
                <Input
                    id="title"
                    element="input"
                    type="text"
                    onInput={inputHandlers.title}
                    label="Title"
                    validators={[minLengthValidator(10)]}
                    errorText="Please enter a valid Title"
                />
                <Input
                    id="address"
                    element="input"
                    type="text"
                    onInput={inputHandlers.address}
                    label="Address"
                    validators={[minLengthValidator(10)]}
                    errorText="Please enter a valid address"
                />
                <Input
                    id={"description"}
                    element="textarea"
                    onInput={inputHandlers.description}
                    label="Description"
                    validators={[minLengthValidator(10)]}
                    errorText="Please enter a valid Description"
                />
                <ImageUpload
                    id="image"
                    onInput={inputHandlers.image}
                    val={state.inputs.image.val}
                    required
                />
                <Button type="submit" disabled={!state.isValid}>
                    Add Place
                </Button>
            </form>
        </>
    );
};

export default NewPlace;
