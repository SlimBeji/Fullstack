import { FormSubmitHandler } from "../../types";

interface PlaceFormProps {
    onSubmit: FormSubmitHandler;
    children?: React.ReactNode;
}

const PlaceForm: React.FC<PlaceFormProps> = (props) => {
    return (
        <form
            className="relative list-none m-0 mx-auto p-4 w-[90%] max-w-[40rem] shadow-md rounded-md bg-white"
            onSubmit={props.onSubmit}
        >
            {props.children}
        </form>
    );
};

export default PlaceForm;
