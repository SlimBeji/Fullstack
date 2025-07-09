import { AxiosResponse } from "axios";
import ErrorModal from "./ErrorModal";
import Modal from "./Modal";
import { Button } from "../form";
import { useNavigate } from "react-router-dom";
import { authSlice, useAppDispatch } from "../../states";

interface HttpErrorProps {
    error: {
        tokenExpired?: boolean;
        message: string;
        response?: AxiosResponse;
    };
    onClear: () => void;
    header?: string;
}

const HttpError: React.FC<HttpErrorProps> = ({ error, onClear, header }) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const tokenExpiredCleaner = () => {
        onClear();
        dispatch(authSlice.actions.logout());
        navigate("/auth");
        console.log("I was executed");
    };

    if (!error.tokenExpired) {
        return (
            <ErrorModal
                error={error.message}
                header={header}
                onClear={onClear}
            />
        );
    }

    return (
        <Modal
            onCancel={tokenExpiredCleaner}
            header="Session Expired"
            show={!!error}
            footer={<Button onClick={tokenExpiredCleaner}>Authenticate</Button>}
        >
            <p>Token expired! Please login again!</p>
        </Modal>
    );
};

export default HttpError;
