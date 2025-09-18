import { AxiosResponse } from "axios";

import { authSlice, useAppDispatch } from "../../store";
import { Button } from "../form";
import ErrorModal from "./ErrorModal";
import Modal from "./Modal";

interface HttpErrorProps {
    error?: {
        tokenExpired?: boolean;
        message: string;
        response?: AxiosResponse;
    };
    onClear: () => void;
    header?: string;
}

const HttpError: React.FC<HttpErrorProps> = ({ error, onClear, header }) => {
    const dispatch = useAppDispatch();

    const tokenExpiredCleaner = () => {
        onClear();
        dispatch(authSlice.actions.logout());
    };

    if (error?.tokenExpired) {
        return (
            <Modal
                onCancel={tokenExpiredCleaner}
                header="Session Expired"
                show={!!error}
                footer={
                    <Button onClick={tokenExpiredCleaner}>Authenticate</Button>
                }
            >
                <p>Token expired! Please login again!</p>
            </Modal>
        );
    }

    if (error) {
        return (
            <ErrorModal
                error={error.message}
                header={header}
                onClear={onClear}
            />
        );
    }
};

export default HttpError;
