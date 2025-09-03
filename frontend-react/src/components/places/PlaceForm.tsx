import { FormSubmitHandler } from "../../types";

interface PlaceFormProps {
    onSubmit: FormSubmitHandler;
    children?: React.ReactNode;
}

const PlaceForm: React.FC<PlaceFormProps> = (props) => {
    return (
        <form className="place-form" onSubmit={props.onSubmit}>
            {props.children}
        </form>
    );
};

export default PlaceForm;
